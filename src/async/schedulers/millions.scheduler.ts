import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import dayjs from 'dayjs';
import { convertUnit, LUM_DENOM, MICRO_LUM_DENOM } from '@lum-network/sdk-javascript';
import { Deposit } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/deposit';
import { PageRequest } from '@lum-network/sdk-javascript/build/codegen/cosmos/base/query/v1beta1/pagination';

import { MillionsBiggestWinnerEntity, MillionsDepositorEntity, MillionsDrawEntity, MillionsPoolEntity, MillionsPrizeEntity } from '@app/database';
import { ChainService, MarketService, MillionsBiggestWinnerService, MillionsDepositorService, MillionsDrawService, MillionsPoolService, MillionsPrizeService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol, getAssetSymbol, groupAndSumDeposits } from '@app/utils';

@Injectable()
export class MillionsScheduler {
    private readonly _logger: Logger = new Logger(MillionsScheduler.name);

    constructor(
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _marketService: MarketService,
        private readonly _millionsBiggestWinnerService: MillionsBiggestWinnerService,
        private readonly _millionsDepositorService: MillionsDepositorService,
        private readonly _millionsDrawService: MillionsDrawService,
        private readonly _millionsPoolService: MillionsPoolService,
        private readonly _millionsPrizeService: MillionsPrizeService,
    ) {}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async poolsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing pools from chain...`);

        const lumChain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);
        const pools = await lumChain.client.lum.network.millions.pools();

        for (const pool of pools.pools) {
            // Get the chain for the pool
            let outstandingPrizePoolAmount = 0;

            try {
                // Get rewards and balance from the ICA account
                const chain = this._chainService.getChain(getAssetSymbol(pool.nativeDenom));

                const [prizePoolRewards, prizePoolBalance] = await Promise.all([
                    chain.client.cosmos.distribution.v1beta1.delegationTotalRewards({ delegatorAddress: pool.icaDepositAddress }),
                    chain.client.cosmos.bank.v1beta1.balance({ address: pool.icaPrizepoolAddress, denom: pool.nativeDenom }),
                ]);

                // Calculate the outstanding prize pool amount
                outstandingPrizePoolAmount = parseInt(prizePoolBalance.balance.amount, 10) + prizePoolRewards.total.filter((reward) => reward.denom === pool.nativeDenom).reduce((a, b) => a + parseInt(b.amount, 10), 0);
            } catch (e) {
                outstandingPrizePoolAmount = 0;

                this._logger.warn(`Cannot get rewards for pool ${pool.poolId}: ${e}`);
            }

            const validators = Object.entries(pool.validators).map(([operatorAddress, validator]) => ({
                operator_address: operatorAddress,
                is_enabled: validator.isEnabled,
                bonded_amount: validator.bondedAmount,
            }));

            const entity: Partial<MillionsPoolEntity> = {
                id: Number(pool.poolId),
                denom: pool.denom,
                denom_native: pool.nativeDenom,
                chain_id: pool.chainId,
                connection_id: pool.connectionId,
                transfer_channel_id: pool.transferChannelId,
                ica_deposit_port_id: pool.icaDepositPortId,
                ica_prize_pool_port_id: pool.icaPrizepoolPortId,
                bech32_prefix_acc_address: pool.bech32PrefixAccAddr,
                bech32_prefix_val_address: pool.bech32PrefixValAddr,
                min_deposit_amount: pool.minDepositAmount,
                local_address: pool.localAddress,
                ica_deposit_address: pool.icaDepositAddress,
                ica_prize_pool_address: pool.icaPrizepoolAddress,
                next_draw_id: Number(pool.nextDrawId),
                tvl_amount: pool.tvlAmount,
                depositors_count: Number(pool.depositorsCount),
                sponsorship_amount: pool.sponsorshipAmount,
                state: pool.state,
                validators: validators,
                last_draw_state: pool.lastDrawState,
                last_draw_created_at: pool.lastDrawCreatedAt,
                created_at_height: Number(pool.createdAtHeight),
                updated_at_height: Number(pool.updatedAtHeight),
                draw_schedule: {
                    initial_draw_at: String(pool.drawSchedule.initialDrawAt),
                    draw_delta: {
                        seconds: Number(pool.drawSchedule.drawDelta.seconds),
                        nanos: pool.drawSchedule.drawDelta.nanos,
                    },
                },
                prize_strategy: {
                    prize_batches: pool.prizeStrategy.prizeBatches.map((prizeBatch) => ({
                        pool_percent: Number(prizeBatch.poolPercent),
                        quantity: Number(prizeBatch.quantity),
                        draw_probability: prizeBatch.drawProbability,
                    })),
                },
                available_prize_pool: {
                    amount: parseInt(pool.availablePrizePool.amount, 10),
                    denom: pool.availablePrizePool.denom,
                },
                outstanding_prize_pool: {
                    amount: Number(outstandingPrizePoolAmount.toFixed()),
                    denom: pool.nativeDenom,
                },
            };

            await this._millionsPoolService.createOrUpdate(entity);
        }
    }

    // Every 10 minutes delay 2 minutes
    @Cron('2-59/10 * * * *')
    async drawsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing draws prizes and biggest winners from chain...`);

        const pools = await this._millionsPoolService.fetchReady();

        const lumChain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);
        const {
            params: { prizeExpirationDelta },
        } = await lumChain.client.lum.network.millions.params();

        for (const pool of pools) {
            let nextPageKey: Uint8Array = new Uint8Array();

            // Get draws for the pool
            while (true) {
                const draws = await lumChain.client.lum.network.millions.poolDraws({
                    poolId: BigInt(pool.id),
                    pagination: PageRequest.fromPartial({
                        key: nextPageKey,
                        limit: BigInt(100),
                        offset: BigInt(0),
                        reverse: false,
                        countTotal: false,
                    }),
                });

                for (const draw of draws.draws) {
                    const id = `${pool.id}-${draw.drawId}`;

                    // If draw already exists more than 2 weeks in db, we skip it
                    if (await this._millionsDrawService.existMoreThan(id, 3600 * 24 * 7 * 2)) {
                        continue;
                    }

                    const formattedDraw: Partial<MillionsDrawEntity> = {
                        id: id,
                        pool_id: pool.id,
                        draw_id: Number(draw.drawId),
                        state: draw.state,
                        error_state: draw.errorState,
                        rand_seed: String(draw.randSeed),
                        prize_pool: draw.prizePool,
                        prize_pool_fresh_amount: draw.prizePoolFreshAmount,
                        prize_pool_remains_amount: draw.prizePoolRemainsAmount,
                        total_winners: Number(draw.totalWinCount),
                        total_winners_amount: draw.totalWinAmount,
                        created_at_height: Number(draw.createdAtHeight),
                        updated_at_height: Number(draw.updatedAtHeight),
                        created_at: draw.createdAt,
                        updated_at: draw.updatedAt,
                        // We don't use this value anymore
                        usd_token_value: 0,
                    };

                    // If draw doesn't exist in db, we save it
                    const savedDraw = await this._millionsDrawService.getById(id);
                    if (!savedDraw) {
                        await this._millionsDrawService.save(formattedDraw);
                    }

                    // If draw has prizesRefs, we process them
                    if (draw.prizesRefs && draw.prizesRefs.length) {
                        const winners: { [address: string]: Partial<MillionsBiggestWinnerEntity> } = {};

                        for (const prizeRef of draw.prizesRefs) {
                            // Get prize info from prizeRef in draw
                            const formattedPrize: Partial<MillionsPrizeEntity> = {
                                id: `${id}-${prizeRef.prizeId}`,
                                pool_id: pool.id,
                                draw_id: Number(draw.drawId),
                                prize_id: Number(prizeRef.prizeId),
                                winner_address: prizeRef.winnerAddress,
                                raw_amount: Number(convertUnit({ amount: prizeRef.amount, denom: MICRO_LUM_DENOM }, LUM_DENOM)),
                                denom_native: pool.denom_native,
                                amount: {
                                    amount: prizeRef.amount,
                                    denom: pool.denom_native,
                                },
                                created_at_height: Number(draw.createdAtHeight),
                                updated_at_height: Number(draw.updatedAtHeight),
                                expires_at: dayjs(draw.createdAt).add(Number(prizeExpirationDelta.seconds), 'seconds').toDate(),
                                created_at: draw.createdAt,
                                updated_at: draw.updatedAt,
                                // We don't use this value anymore
                                usd_token_value: 0,
                            };

                            await this._millionsPrizeService.createOrUpdate(formattedPrize);

                            // Sum up prizes by winner address
                            if (winners[formattedPrize.winner_address]?.id) {
                                winners[formattedPrize.winner_address].raw_amount += formattedPrize.raw_amount;
                            } else {
                                winners[formattedPrize.winner_address] = {
                                    id: formattedPrize.winner_address,
                                    raw_amount: formattedPrize.raw_amount,
                                    draw_id: formattedPrize.draw_id,
                                    denom_native: formattedPrize.denom_native,
                                    created_at: formattedPrize.created_at,
                                    sum_of_deposits: 0,
                                    apr: 0,
                                    created_at_height: formattedPrize.created_at_height,
                                    pool_id: formattedPrize.pool_id,
                                };
                            }
                        }

                        for (const winner of Object.values(winners)) {
                            let page: Uint8Array | undefined = undefined;
                            let sumOfDepositsBeforeDraw = 0;

                            // Get all deposits for the winner address
                            while (true) {
                                const deposits = await lumChain.client.lum.network.millions.accountPoolDeposits({ depositorAddress: winner.id, poolId: draw.poolId, pagination: page ? ({ key: page } as PageRequest) : undefined });

                                // Sum up all deposits before this draw
                                sumOfDepositsBeforeDraw += deposits.deposits.reduce((acc, deposit) => {
                                    if (deposit.createdAtHeight < draw.createdAtHeight && !deposit.isSponsor) {
                                        return acc + Number(convertUnit({ amount: deposit.amount.amount, denom: MICRO_LUM_DENOM }, LUM_DENOM));
                                    }

                                    return acc;
                                }, 0);

                                // If we have pagination key, we just patch it, and it will process in the next loop
                                if (deposits.pagination && deposits.pagination.nextKey && deposits.pagination.nextKey.length) {
                                    page = deposits.pagination.nextKey;
                                } else {
                                    break;
                                }
                            }

                            winner.sum_of_deposits = sumOfDepositsBeforeDraw;
                            winner.apr = (winner.raw_amount / winner.sum_of_deposits) * 100;

                            await this._millionsBiggestWinnerService.createOrUpdateAccordingToApr(winner);
                        }
                    }
                }

                // If we have pagination key, we just patch it, and it will process in the next loop
                if (draws.pagination && draws.pagination.nextKey && draws.pagination.nextKey.length) {
                    nextPageKey = draws.pagination.nextKey;
                } else {
                    break;
                }
            }
        }

        this._logger.log(`Draws prizes and biggest winners synced!`);
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async depositorsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing depositors from chain...`);

        const pools = await this._millionsPoolService.fetchReady();
        const lumChain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);

        for (const pool of pools) {
            let nextPageKey: Uint8Array = new Uint8Array();
            const allDeposits: Deposit[] = [];

            // Get all deposits for the pool
            while (true) {
                const deposits = await lumChain.client.lum.network.millions.poolDeposits({
                    poolId: BigInt(pool.id),
                    pagination: PageRequest.fromPartial({
                        key: nextPageKey,
                        limit: BigInt(100),
                        offset: BigInt(0),
                        reverse: false,
                        countTotal: false,
                    }),
                });

                allDeposits.push(...deposits.deposits);

                // If we have pagination key, we just patch it, and it will process in the next loop
                if (deposits.pagination && deposits.pagination.nextKey && deposits.pagination.nextKey.length) {
                    nextPageKey = deposits.pagination.nextKey;
                } else {
                    break;
                }
            }

            // Group deposits by depositor address, sum amounts and ignore sponsors
            const aggregatedDeposits = groupAndSumDeposits(allDeposits);

            // Sort deposits by amount
            const sortedDeposits = aggregatedDeposits.sort((a, b) => b.rawAmount - a.rawAmount);

            // Format deposits to db entity
            const formattedDeposits = sortedDeposits.map((deposit, index) => {
                return {
                    id: `${pool.id}-${deposit.depositorAddress}`,
                    address: deposit.depositorAddress,
                    pool_id: pool.id,
                    amount: deposit.rawAmount,
                    rank: index + 1,
                    native_denom: pool.denom_native,
                } as MillionsDepositorEntity;
            });

            // Delete all old deposits for the pool and save new
            await this._millionsDepositorService.deleteByPoolId(pool.id);
            await this._millionsDepositorService.saveBulk(formattedDeposits);
        }
    }
}
