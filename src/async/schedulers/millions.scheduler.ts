import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import long from 'long';
import { LumConstants } from '@lum-network/sdk-javascript';

import { MillionsDrawEntity, MillionsPoolEntity, MillionsPrizeEntity } from '@app/database';
import { ChainService, MillionsDrawService, MillionsPoolService, MillionsPrizeService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol, getAssetSymbol } from '@app/utils';

@Injectable()
export class MillionsScheduler {
    private readonly _logger: Logger = new Logger(MillionsScheduler.name);

    constructor(
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _millionsDrawService: MillionsDrawService,
        private readonly _millionsPoolService: MillionsPoolService,
        private readonly _millionsPrizeService: MillionsPrizeService,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async poolsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing pools from chain...`);

        let page: Uint8Array | undefined = undefined;

        while (true) {
            const pools = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.pools(page);

            // For each stored pool, we query chain and ask for pools
            for (const pool of pools.pools) {
                const validators: { operator_address: string; is_enabled: boolean; bonded_amount: string; rewards_amount }[] = [];

                // Get the chain for the pool
                const chain = await this._chainService.getChain(getAssetSymbol(pool.nativeDenom));

                for (const key in pool.validators) {
                    const address = pool.nativeDenom === LumConstants.MicroLumDenom ? pool.moduleAccountAddress : pool.icaAccountAddress;

                    if (!address) {
                        continue;
                    }

                    // Get rewards for the module account
                    try {
                        const accountRewards = await chain.client.queryClient.distribution.delegationRewards(address, key);

                        validators.push({
                            operator_address: key,
                            is_enabled: pool.validators[key].isEnabled,
                            bonded_amount: pool.validators[key].bondedAmount,
                            rewards_amount: accountRewards.rewards,
                        });
                    } catch (e) {
                        this._logger.warn(e);
                    }
                }

                const entity: Partial<MillionsPoolEntity> = {
                    id: pool.poolId.toNumber(),
                    denom: pool.denom,
                    denom_native: pool.nativeDenom,
                    chain_id: pool.chainId,
                    connection_id: pool.connectionId,
                    transfer_channel_id: pool.transferChannelId,
                    controller_port_id: pool.controllerPortId,
                    bech32_prefix_acc_address: pool.bech32PrefixAccAddr,
                    bech32_prefix_val_address: pool.bech32PrefixValAddr,
                    min_deposit_amount: pool.minDepositAmount,
                    module_account_address: pool.moduleAccountAddress,
                    ica_account_address: pool.icaAccountAddress,
                    next_draw_id: pool.nextDrawId.toNumber(),
                    tvl_amount: pool.tvlAmount,
                    depositors_count: pool.depositorsCount.toNumber(),
                    last_draw_state: pool.lastDrawState,
                    state: pool.state,
                    created_at_height: pool.createdAtHeight.toNumber(),
                    updated_at_height: pool.updatedAtHeight.toNumber(),
                    validators: validators,
                    draw_schedule: {
                        initial_draw_at: pool.drawSchedule.initialDrawAt.toString(),
                        draw_delta: {
                            seconds: pool.drawSchedule.drawDelta.seconds.toNumber(),
                            nanos: pool.drawSchedule.drawDelta.nanos,
                        },
                    },
                    prize_strategy: {
                        prize_batches: pool.prizeStrategy.prizeBatches.map((prizeBatch) => ({
                            pool_percent: prizeBatch.poolPercent.toNumber(),
                            quantity: prizeBatch.quantity.toNumber(),
                            draw_probability: prizeBatch.drawProbability,
                        })),
                    },
                    last_draw_created_at: pool.lastDrawCreatedAt,
                    available_prize_pool: {
                        amount: pool.availablePrizePool.amount,
                        denom: pool.availablePrizePool.denom,
                    },
                };

                await this._millionsPoolService.createOrUpdate(entity);
            }

            // If we have pagination key, we just patch it, and it will process in the next loop
            if (pools.pagination && pools.pagination.nextKey && pools.pagination.nextKey.length) {
                page = pools.pagination.nextKey;
            } else {
                break;
            }
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async drawsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing draws and prizes from chain...`);

        const pools = await this._millionsPoolService.fetch();

        for (const pool of pools) {
            let page: Uint8Array | undefined = undefined;

            //TODO: if pool is not active, we skip it

            while (true) {
                const draws = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.poolDraws(long.fromNumber(pool.id), page);

                for (const draw of draws.draws) {
                    const id = `${pool.id}-${draw.drawId.toNumber()}`;

                    // If draw already exists, we skip it
                    if (await this._millionsDrawService.isExists(id)) {
                        continue;
                    }

                    const formattedDraw: Partial<MillionsDrawEntity> = {
                        id: id,
                        pool_id: pool.id,
                        draw_id: draw.drawId.toNumber(),
                        state: draw.state,
                        error_state: draw.errorState,
                        rand_seed: draw.randSeed.toString(),
                        prize_pool_fresh_amount: draw.prizePoolFreshAmount,
                        prize_pool_remains_amount: draw.prizePoolRemainsAmount,
                        total_winners: draw.totalWinCount.toNumber(),
                        total_winners_amount: draw.totalWinAmount,
                        created_at_height: draw.createdAtHeight.toNumber(),
                        updated_at_height: draw.updatedAtHeight.toNumber(),
                        prize_pool: draw.prizePool,
                        created_at: draw.createdAt,
                        updated_at: draw.updatedAt,
                    };

                    await this._millionsDrawService.save(formattedDraw);

                    if (draw.prizesRefs && draw.prizesRefs.length) {
                        for (const prizeRef of draw.prizesRefs) {
                            // Get prize info from prizeRef in draw
                            let formattedPrize: Partial<MillionsPrizeEntity> = {
                                id: `${id}-${prizeRef.prizeId.toNumber()}`,
                                pool_id: pool.id,
                                draw_id: draw.drawId.toNumber(),
                                prize_id: prizeRef.prizeId.toNumber(),
                                winner_address: prizeRef.winnerAddress,
                                raw_amount: prizeRef.amount,
                                amount: {
                                    amount: prizeRef.amount,
                                    denom: pool.denom_native,
                                },
                            };

                            try {
                                // Get more prize info from chain and merge it with formattedPrize
                                const prize = await this._chainService
                                    .getChain<LumChain>(AssetSymbol.LUM)
                                    .client.queryClient.millions.poolDrawPrize(long.fromNumber(pool.id), draw.drawId, prizeRef.prizeId);

                                formattedPrize = {
                                    ...formattedPrize,
                                    state: prize.state,
                                    created_at_height: prize.createdAtHeight.toNumber(),
                                    updated_at_height: prize.updatedAtHeight.toNumber(),
                                    expires_at: prize.expiresAt,
                                    created_at: prize.createdAt,
                                    updated_at: prize.updatedAt,
                                };

                                await this._millionsPrizeService.save(formattedPrize);
                            } catch (e) {
                                this._logger.warn(e);
                            }
                        }
                    }
                }

                // If we have pagination key, we just patch it, and it will process in the next loop
                if (draws.pagination && draws.pagination.nextKey && draws.pagination.nextKey.length) {
                    page = draws.pagination.nextKey;
                } else {
                    break;
                }
            }
        }
    }
}
