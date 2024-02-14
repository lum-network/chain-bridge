import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';

import { Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { MICRO_LUM_DENOM } from '@lum-network/sdk-javascript';
import { DepositState } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/deposit';
import { Pool } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/pool';
import { WithdrawalState } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/withdrawal';
import { Draw } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/draw';
import { IdentifiedChannel, State } from '@lum-network/sdk-javascript/build/codegen/ibc/core/channel/v1/channel';
import { PageRequest } from '@lum-network/sdk-javascript/build/codegen/cosmos/base/query/v1beta1/pagination';

import { AssetSymbol, depositStateToString, MetricNames, sleep, withdrawalStateToString } from '@app/utils';
import { ChainService } from '@app/services';
import { LumChain } from '@app/services/chains';

@Injectable()
export class MetricScheduler {
    private readonly _logger: Logger = new Logger(MetricScheduler.name);
    constructor(
        // Lum metrics constructors
        @InjectMetric(MetricNames.COMMUNITY_POOL_SUPPLY) private readonly _communityPoolSupply: Gauge<string>,
        @InjectMetric(MetricNames.LUM_CURRENT_SUPPLY) private readonly _lumCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.MARKET_CAP) private readonly _marketCap: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_EUR) private readonly _lumPriceEUR: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_USD) private readonly _lumPriceUSD: Gauge<string>,
        // Millions metrics constructors
        @InjectMetric(MetricNames.MILLIONS_POOL_VALUE_LOCKED) private readonly _millionsPoolValueLocked: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_DEPOSITORS) private readonly _millionsPoolDepositors: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_PRIZE_AMOUNT) private readonly _millionsPoolPrizeAmount: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_PRIZE_WINNERS) private readonly _millionsPoolPrizeWinners: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_DEPOSITS) private readonly _millionsDeposits: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_WITHDRAWALS) private readonly _millionsWithdrawals: Gauge<string>,
        // IBC metrics constructors
        @InjectMetric(MetricNames.IBC_OPEN_CHANNELS) private readonly _ibcOpenChannels: Gauge<string>,
        @InjectMetric(MetricNames.IBC_CLOSED_CHANNELS) private readonly _ibcClosedChannels: Gauge<string>,
        @InjectMetric(MetricNames.IBC_OTHER_CHANNELS) private readonly _ibcOtherChannels: Gauge<string>,
        @InjectMetric(MetricNames.IBC_PENDING_PACKETS) private readonly _ibcPendingPackets: Gauge<string>,
        // General metrics constructors
        @InjectMetric(MetricNames.TWITTER_FOLLOWERS) private readonly _twitterFollowers: Gauge<string>,
        private readonly _configService: ConfigService,
        private readonly _chainService: ChainService,
    ) {}

    async updateMetric(@Payload() data: { name: string; value: number; labels: object }): Promise<void> {
        if (!data.name || !data.value) {
            return;
        }

        const metrics = new Map<string, Gauge<string>>();
        metrics.set(MetricNames.COMMUNITY_POOL_SUPPLY, this._communityPoolSupply);
        metrics.set(MetricNames.LUM_CURRENT_SUPPLY, this._lumCurrentSupply);
        metrics.set(MetricNames.MARKET_CAP, this._marketCap);
        metrics.set(MetricNames.LUM_PRICE_EUR, this._lumPriceEUR);
        metrics.set(MetricNames.LUM_PRICE_USD, this._lumPriceUSD);
        metrics.set(MetricNames.TWITTER_FOLLOWERS, this._twitterFollowers);
        metrics.set(MetricNames.MILLIONS_POOL_VALUE_LOCKED, this._millionsPoolValueLocked);
        metrics.set(MetricNames.MILLIONS_POOL_DEPOSITORS, this._millionsPoolDepositors);
        metrics.set(MetricNames.MILLIONS_POOL_PRIZE_AMOUNT, this._millionsPoolPrizeAmount);
        metrics.set(MetricNames.MILLIONS_POOL_PRIZE_WINNERS, this._millionsPoolPrizeWinners);
        metrics.set(MetricNames.MILLIONS_DEPOSITS, this._millionsDeposits);
        metrics.set(MetricNames.MILLIONS_WITHDRAWALS, this._millionsWithdrawals);
        metrics.set(MetricNames.IBC_OPEN_CHANNELS, this._ibcOpenChannels);
        metrics.set(MetricNames.IBC_CLOSED_CHANNELS, this._ibcClosedChannels);
        metrics.set(MetricNames.IBC_OTHER_CHANNELS, this._ibcOtherChannels);
        metrics.set(MetricNames.IBC_PENDING_PACKETS, this._ibcPendingPackets);

        const setter = metrics.get(data.name);
        if (!setter) {
            this._logger.error(`Metric ${data.name} not found`);
            return;
        }
        this._logger.debug(`Updating metric ${data.name} with value ${data.value} (labels ${Object.keys(data.labels || {}).join(',')})`);
        if (data.labels === null || data.labels === undefined) {
            setter.set(data.value);
        } else {
            setter.labels(data.labels).set(data.value);
        }
    }

    // As we rely on external APIs to compute some DFR metrics we trigger the cron every min to avoid rate limiting and error chaining
    @Cron(CronExpression.EVERY_MINUTE)
    async update() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing global metrics...`);

        // Acquire data
        const [lumCommunityPool, lumSupply, lumPrice, lumPriceEUR, lumCommunityData] = await Promise.all([
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.cosmos.distribution.v1beta1.communityPool(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getTokenSupply(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPrice(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPriceEUR(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getCommunityData(),
        ]);

        // Compute community pool supply
        const communityPoolSupply = lumCommunityPool.pool.find((coin) => coin.denom === MICRO_LUM_DENOM);

        await Promise.all([
            // LUM metrics
            communityPoolSupply && this.updateMetric({ name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10), labels: null }),
            lumSupply && this.updateMetric({ name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply, labels: null }),
            lumSupply && this.updateMetric({ name: MetricNames.MARKET_CAP, value: lumSupply * lumPrice, labels: null }),
            lumPrice && this.updateMetric({ name: MetricNames.LUM_PRICE_EUR, value: lumPriceEUR, labels: null }),
            lumPrice && this.updateMetric({ name: MetricNames.LUM_PRICE_USD, value: lumPrice, labels: null }),

            // General metrics
            lumPrice && this.updateMetric({ name: MetricNames.TWITTER_FOLLOWERS, value: lumCommunityData.twitter_followers, labels: null }),
        ]);
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async updateMillionsBasic() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`[MillionsBasics] Syncing...`);

        // Acquire list of pools
        let nextPageKey: Uint8Array = new Uint8Array();
        const pools: Pool[] = [];
        while (true) {
            const lPools = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.lum.network.millions.pools({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    limit: BigInt(0),
                    offset: BigInt(0),
                    reverse: false,
                    countTotal: false,
                }),
            });
            pools.push(...lPools.pools);
            if (lPools.pagination && lPools.pagination.nextKey && lPools.pagination.nextKey.length > 0) {
                nextPageKey = lPools.pagination.nextKey;
            } else {
                break;
            }
        }

        // Acquire deposits
        const depositMetas: any = {
            [DepositState.DEPOSIT_STATE_UNSPECIFIED]: 0,
            [DepositState.DEPOSIT_STATE_IBC_TRANSFER]: 0,
            [DepositState.DEPOSIT_STATE_ICA_DELEGATE]: 0,
            [DepositState.DEPOSIT_STATE_SUCCESS]: 0,
            [DepositState.DEPOSIT_STATE_FAILURE]: 0,
        };
        nextPageKey = new Uint8Array();
        while (true) {
            const deposits = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.lum.network.millions.deposits({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    limit: BigInt(0),
                    offset: BigInt(0),
                    reverse: false,
                    countTotal: false,
                }),
            });

            // Increase the given state
            for (const deposit of deposits.deposits) {
                depositMetas[deposit.state]++;
            }

            if (deposits.pagination && deposits.pagination.nextKey && deposits.pagination.nextKey.length > 0) {
                nextPageKey = deposits.pagination.nextKey;
            } else {
                break;
            }
        }

        // Acquire withdrawals
        const withdrawalMetas: any = {
            [WithdrawalState.WITHDRAWAL_STATE_UNSPECIFIED]: 0,
            [WithdrawalState.WITHDRAWAL_STATE_ICA_UNDELEGATE]: 0,
            [WithdrawalState.WITHDRAWAL_STATE_ICA_UNBONDING]: 0,
            [WithdrawalState.WITHDRAWAL_STATE_IBC_TRANSFER]: 0,
            [WithdrawalState.WITHDRAWAL_STATE_PENDING]: 0,
            [WithdrawalState.WITHDRAWAL_STATE_FAILURE]: 0,
        };
        nextPageKey = new Uint8Array();
        while (true) {
            const withdrawals = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.lum.network.millions.withdrawals({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    limit: BigInt(0),
                    offset: BigInt(0),
                    reverse: false,
                    countTotal: false,
                }),
            });

            // Increase the given state
            for (const withdrawal of withdrawals.withdrawals) {
                withdrawalMetas[withdrawal.state]++;
            }

            if (withdrawals.pagination && withdrawals.pagination.nextKey && withdrawals.pagination.nextKey.length > 0) {
                nextPageKey = withdrawals.pagination.nextKey;
            } else {
                break;
            }
        }

        // Broadcast metrics
        this._logger.debug(`[MillionsBasics] Broadcasting metrics...`);
        for (const pool of pools) {
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_VALUE_LOCKED, value: Number(pool.tvlAmount), labels: { pool_id: pool.poolId } });
            await sleep(500);
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_DEPOSITORS, value: Number(pool.depositorsCount), labels: { pool_id: pool.poolId } });
        }
        await sleep(1000);
        for (const depositState of Object.keys(depositMetas)) {
            await this.updateMetric({ name: MetricNames.MILLIONS_DEPOSITS, value: Number(depositMetas[depositState]), labels: { deposit_state: depositStateToString(Number(depositState)) } });
        }
        await sleep(1000);
        for (const withdrawalState of Object.keys(withdrawalMetas)) {
            await this.updateMetric({ name: MetricNames.MILLIONS_WITHDRAWALS, value: Number(withdrawalMetas[withdrawalState]), labels: { withdrawal_state: withdrawalStateToString(Number(withdrawalState)) } });
        }
        this._logger.debug(`[MillionsBasics] Metrics broadcasted`);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async updateMillionsDraws() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

        this._logger.debug(`[MillionsDraws] Syncing...`);

        // Acquire pool draws
        let nextPageKey: Uint8Array = new Uint8Array();
        const draws: Draw[] = [];
        while (true) {
            const lDraws = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.lum.network.millions.draws({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    limit: BigInt(0),
                    offset: BigInt(0),
                    reverse: false,
                    countTotal: false,
                }),
            });
            draws.push(...lDraws.draws);
            if (lDraws.pagination && lDraws.pagination.nextKey && lDraws.pagination.nextKey.length > 0) {
                nextPageKey = lDraws.pagination.nextKey;
            } else {
                break;
            }
        }

        // Broadcast metrics
        this._logger.debug(`[MillionsDraws] Metrics acquired, now broadcasting...`);
        for (const draw of draws) {
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_PRIZE_AMOUNT, value: Number(draw.totalWinAmount), labels: { pool_id: draw.poolId, draw_id: draw.drawId } });
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_PRIZE_WINNERS, value: Number(draw.totalWinCount), labels: { pool_id: draw.poolId, draw_id: draw.drawId } });
        }
        this._logger.debug(`[MillionsDraws] Metrics broadcasted`);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async updateIbc() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

        this._logger.debug(`[IBC] Syncing...`);

        // Grab our channels
        let nextPageKey: Uint8Array = new Uint8Array();
        const channels: IdentifiedChannel[] = [];
        while (true) {
            const lChannels = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).ibcQueryClient.ibc.core.channel.v1.channels({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    limit: BigInt(0),
                    offset: BigInt(0),
                    reverse: false,
                    countTotal: false,
                }),
            });
            channels.push(...lChannels.channels);
            if (lChannels.pagination && lChannels.pagination.nextKey && lChannels.pagination.nextKey.length > 0) {
                nextPageKey = lChannels.pagination.nextKey;
            } else {
                break;
            }
        }

        // Process our stats
        let openChannels = 0;
        let closedChannels = 0;
        let otherChannels = 0;
        for (const channel of channels) {
            if (channel.state === State.STATE_OPEN) {
                openChannels++;
            } else if (channel.state === State.STATE_CLOSED) {
                closedChannels++;
            } else {
                otherChannels++;
            }
        }

        await this.updateMetric({ name: MetricNames.IBC_OPEN_CHANNELS, value: Number(openChannels), labels: {} });
        await this.updateMetric({ name: MetricNames.IBC_CLOSED_CHANNELS, value: Number(closedChannels), labels: {} });
        await this.updateMetric({ name: MetricNames.IBC_OTHER_CHANNELS, value: Number(otherChannels), labels: {} });
    }
}
