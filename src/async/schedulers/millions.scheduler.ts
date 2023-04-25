import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { ChainService, MillionsPoolsService } from '@app/services';
import { LumChain } from '@app/services/chains';

import { AssetSymbol, getAssetSymbol } from '@app/utils';
import { MillionsPoolsEntity } from '@app/database';

@Injectable()
export class MillionsScheduler {
    private readonly _logger: Logger = new Logger(MillionsScheduler.name);

    constructor(private readonly _configService: ConfigService, private readonly _millionsPoolsService: MillionsPoolsService, private readonly _chainService: ChainService) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async poolsSync() {
        if (!this._configService.get<boolean>('MILLIONS_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing pools from chain...`);
        const pools = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.pools();
        this._logger.debug(`Found ${pools.length} pools to sync`);

        // For each stored pool, we query chain and ask for pools
        for (const pool of pools) {
            const validators: { operator_address: string; is_enabled: boolean; bonded_amount: string; rewards_amount }[] = [];

            // Get the chain for the pool
            const chain = await this._chainService.getChain(getAssetSymbol(pool.nativeDenom));

            for (const key in pool.validators) {
                // Get rewards for the module account
                const accountRewards = await chain.client.queryClient.distribution.delegationRewards(pool.icaAccountAddress ? pool.icaAccountAddress : pool.moduleAccountAddress, key);

                validators.push({
                    operator_address: key,
                    is_enabled: pool.validators[key].isEnabled,
                    bonded_amount: pool.validators[key].bondedAmount,
                    rewards_amount: accountRewards.rewards,
                });
            }

            const entity: Partial<MillionsPoolsEntity> = {
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
                        seconds: pool.drawSchedule.drawDelta.seconds.toString(),
                        nanos: pool.drawSchedule.drawDelta.nanos.toString(),
                    },
                },
                prize_strategy: {
                    prize_batches: pool.prizeStrategy.prizeBatches.map((prizeBatch) => ({
                        pool_percent: prizeBatch.poolPercent.toString(),
                        quantity: prizeBatch.quantity.toString(),
                        draw_probability: prizeBatch.drawProbability,
                    })),
                },
                last_draw_created_at: pool.lastDrawCreatedAt,
                available_prize_pool: {
                    amount: pool.availablePrizePool.amount,
                    denom: pool.availablePrizePool.denom,
                },
            };

            await this._millionsPoolsService.createOrUpdate(entity);
        }
    }
}
