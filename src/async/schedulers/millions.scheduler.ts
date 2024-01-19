import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import dayjs from 'dayjs';
import long from 'long';
import { convertUnit, LUM_DENOM, MICRO_LUM_DENOM } from '@lum-network/sdk-javascript';
import { Deposit } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/deposit';

import { MillionsBiggestWinnerEntity, MillionsDepositorEntity, MillionsDrawEntity, MillionsPoolEntity, MillionsPrizeEntity } from '@app/database';
import { ChainService, MarketService, MillionsBiggestWinnerService, MillionsDepositorService, MillionsDrawService, MillionsPoolService, MillionsPrizeService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol, CLIENT_PRECISION, getAssetSymbol, groupAndSumDeposits } from '@app/utils';

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

        let page: Uint8Array | undefined = undefined;
        const lumChain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);

        while (true) {
            const pools = await lumChain.client.queryClient.millions.pools(page);

            for (const pool of pools.pools) {
                // Get the chain for the pool
                const chain = this._chainService.getChain(getAssetSymbol(pool.nativeDenom));
                let outstandingPrizePoolAmount = 0;

                try {
                    // Get rewards and balance from the ICA account
                    const [prizePoolRewards, prizePoolBalance] = await Promise.all([
                        chain.client.queryClient.distribution.delegationTotalRewards(pool.icaDepositAddress),
                        chain.client.queryClient.bank.balance(pool.icaPrizepoolAddress, pool.nativeDenom),
                    ]);

                    // Calculate the outstanding prize pool amount
                    outstandingPrizePoolAmount = parseInt(prizePoolBalance.amount, 10) + prizePoolRewards.total.filter((reward) => reward.denom === pool.nativeDenom).reduce((a, b) => a + parseInt(b.amount, 10) / CLIENT_PRECISION, 0);
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
                    id: pool.poolId.toNumber(),
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
                    next_draw_id: pool.nextDrawId.toNumber(),
                    tvl_amount: pool.tvlAmount,
                    depositors_count: pool.depositorsCount.toNumber(),
                    sponsorship_amount: pool.sponsorshipAmount,
                    state: pool.state,
                    validators: validators,
                    last_draw_state: pool.lastDrawState,
                    last_draw_created_at: pool.lastDrawCreatedAt,
                    created_at_height: pool.createdAtHeight.toNumber(),
                    updated_at_height: pool.updatedAtHeight.toNumber(),
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

            // If we have pagination key, we just patch it, and it will process in the next loop
            if (pools.pagination && pools.pagination.nextKey && pools.pagination.nextKey.length) {
                page = pools.pagination.nextKey;
            } else {
                break;
            }
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
        const { prizeExpirationDelta } = await lumChain.client.queryClient.millions.params();

        for (const pool of pools) {
            let page: Uint8Array | undefined = undefined;

            // Get draws for the pool
            while (true) {
                const draws = await lumChain.client.queryClient.millions.poolDraws(long.fromNumber(pool.id), page);

                for (const draw of draws.draws) {
                    const id = `${pool.id}-${draw.drawId.toNumber()}`;

                    // If draw already exists more than 2 weeks in db, we skip it
                    if (await this._millionsDrawService.existMoreThan(id, 3600 * 24 * 7 * 2)) {
                        continue;
                    }

                    // Get Draw from db if exists
                    const savedDraw = await this._millionsDrawService.getById(id);

                    const formattedDraw: Partial<MillionsDrawEntity> = {
                        id: id,
                        pool_id: pool.id,
                        draw_id: draw.drawId.toNumber(),
                        state: draw.state,
                        error_state: draw.errorState,
                        rand_seed: draw.randSeed.toString(),
                        prize_pool: draw.prizePool,
                        prize_pool_fresh_amount: draw.prizePoolFreshAmount,
                        prize_pool_remains_amount: draw.prizePoolRemainsAmount,
                        total_winners: draw.totalWinCount.toNumber(),
                        total_winners_amount: draw.totalWinAmount,
                        created_at_height: draw.createdAtHeight.toNumber(),
                        updated_at_height: draw.updatedAtHeight.toNumber(),
                        created_at: draw.createdAt,
                        updated_at: draw.updatedAt,
                        usd_token_value: await this._marketService.getTokenPrice(getAssetSymbol(pool.denom_native)),
                    };

                    // If draw doesn't exist in db, we save it
                    if (!savedDraw) {
                        await this._millionsDrawService.save(formattedDraw);
                    }

                    // If draw has prizesRefs, we process them
                    if (draw.prizesRefs && draw.prizesRefs.length) {
                        const winners: { [address: string]: Partial<MillionsBiggestWinnerEntity> } = {};

                        for (const prizeRef of draw.prizesRefs) {
                            // Get prize info from prizeRef in draw
                            const formattedPrize: Partial<MillionsPrizeEntity> = {
                                id: `${id}-${prizeRef.prizeId.toNumber()}`,
                                pool_id: pool.id,
                                draw_id: draw.drawId.toNumber(),
                                prize_id: prizeRef.prizeId.toNumber(),
                                winner_address: prizeRef.winnerAddress,
                                raw_amount: Number(convertUnit({ amount: prizeRef.amount, denom: MICRO_LUM_DENOM }, LUM_DENOM)),
                                denom_native: pool.denom_native,
                                amount: {
                                    amount: prizeRef.amount,
                                    denom: pool.denom_native,
                                },
                                created_at_height: draw.createdAtHeight.toNumber(),
                                updated_at_height: draw.updatedAtHeight.toNumber(),
                                expires_at: dayjs(draw.createdAt).add(prizeExpirationDelta.seconds.toNumber(), 'seconds').toDate(),
                                created_at: draw.createdAt,
                                updated_at: draw.updatedAt,
                                usd_token_value: savedDraw ? savedDraw.usd_token_value : formattedDraw.usd_token_value,
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
                                const deposits = await lumChain.client.queryClient.millions.accountPoolDeposits(winner.id, draw.poolId, page);

                                // Sum up all deposits before this draw
                                sumOfDepositsBeforeDraw += deposits.deposits.reduce((acc, deposit) => {
                                    if (deposit.createdAtHeight.toNumber() < draw.createdAtHeight.toNumber() && !deposit.isSponsor) {
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
                    page = draws.pagination.nextKey;
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
            let page: Uint8Array | undefined = undefined;
            const allDeposits: Deposit[] = [];

            // Get all deposits for the pool
            while (true) {
                const deposits = await lumChain.client.queryClient.millions.poolDeposits(long.fromNumber(pool.id), page);

                allDeposits.push(...deposits.deposits);

                // If we have pagination key, we just patch it, and it will process in the next loop
                if (deposits.pagination && deposits.pagination.nextKey && deposits.pagination.nextKey.length) {
                    page = deposits.pagination.nextKey;
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
