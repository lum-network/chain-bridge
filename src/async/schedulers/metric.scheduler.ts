import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';

import { Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

import { LumConstants } from '@lum-network/sdk-javascript';
import { Pool } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/pool';
import { Draw } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/draw';
import { DepositState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/deposit';
import { WithdrawalState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/withdrawal';

import { AssetSymbol, CLIENT_PRECISION, depositStateToString, MetricNames, withdrawalStateToString } from '@app/utils';
import { ChainService, DfractService } from '@app/services';
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
        // Dfr metrics constructors
        @InjectMetric(MetricNames.DFRACT_CURRENT_SUPPLY) private readonly _dfractCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_MA_BALANCE) private readonly _dfractMaBalance: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_APY) private readonly _dfractApy: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_NEW_DFR_TO_MINT) private readonly _dfractNewDfrToMint: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_BACKING_PRICE) private readonly _dfractBackingPrice: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_MINT_RATIO) private readonly _dfractMintRatio: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_MARKET_CAP) private readonly _dfractMarketCap: Gauge<string>,
        // Millions metrics constructors
        @InjectMetric(MetricNames.MILLIONS_POOL_VALUE_LOCKED) private readonly _millionsPoolValueLocked: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_DEPOSITORS) private readonly _millionsPoolDepositors: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_PRIZE_AMOUNT) private readonly _millionsPoolPrizeAmount: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_POOL_PRIZE_WINNERS) private readonly _millionsPoolPrizeWinners: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_DEPOSITS) private readonly _millionsDeposits: Gauge<string>,
        @InjectMetric(MetricNames.MILLIONS_WITHDRAWALS) private readonly _millionsWithdrawals: Gauge<string>,
        // General metrics constructors
        @InjectMetric(MetricNames.TWITTER_FOLLOWERS) private readonly _twitterFollowers: Gauge<string>,
        private readonly _configService: ConfigService,
        private readonly _dfrService: DfractService,
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
        metrics.set(MetricNames.DFRACT_APY, this._dfractApy);
        metrics.set(MetricNames.DFRACT_BACKING_PRICE, this._dfractBackingPrice);
        metrics.set(MetricNames.DFRACT_CURRENT_SUPPLY, this._dfractCurrentSupply);
        metrics.set(MetricNames.DFRACT_MARKET_CAP, this._dfractMarketCap);
        metrics.set(MetricNames.DFRACT_MA_BALANCE, this._dfractMaBalance);
        metrics.set(MetricNames.DFRACT_MINT_RATIO, this._dfractMintRatio);
        metrics.set(MetricNames.DFRACT_NEW_DFR_TO_MINT, this._dfractNewDfrToMint);
        metrics.set(MetricNames.TWITTER_FOLLOWERS, this._twitterFollowers);
        metrics.set(MetricNames.MILLIONS_POOL_VALUE_LOCKED, this._millionsPoolValueLocked);
        metrics.set(MetricNames.MILLIONS_POOL_DEPOSITORS, this._millionsPoolDepositors);
        metrics.set(MetricNames.MILLIONS_POOL_PRIZE_AMOUNT, this._millionsPoolPrizeAmount);
        metrics.set(MetricNames.MILLIONS_POOL_PRIZE_WINNERS, this._millionsPoolPrizeWinners);
        metrics.set(MetricNames.MILLIONS_DEPOSITS, this._millionsDeposits);
        metrics.set(MetricNames.MILLIONS_WITHDRAWALS, this._millionsWithdrawals);

        const setter = metrics.get(data.name);
        if (!setter) {
            this._logger.error(`Metric ${data.name} not found`);
            return;
        }
        this._logger.debug(`Updating metric ${data.name} with value ${data.value} (labels ${Object.keys(data.labels || {}).join(',')})`);
        if (!data.labels && !Object.keys(data.labels).length) {
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
        const [lumCommunityPool, lumSupply, lumPrice, lumPriceEUR, lumCommunityData, dfrApy, dfrBackingPrice, dfrSupply, dfrMcap, dfrBalance, newDfrToMint, dfrMintRatio] = await Promise.all([
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.distribution.communityPool(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getTokenSupply(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPrice(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPriceEUR(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getCommunityData(),
            this._dfrService.getApy(),
            this._dfrService.getDfrBackingPrice(),
            this._dfrService.getTokenSupply(),
            this._dfrService.getMcap(),
            this._dfrService.getAccountBalance(),
            this._dfrService.getNewDfrToMint(),
            this._dfrService.getDfrMintRatio(),
        ]);

        // Compute community pool supply
        const communityPoolSupply = lumCommunityPool.pool.find((coin) => coin.denom === LumConstants.MicroLumDenom);

        await Promise.all([
            // LUM metrics
            communityPoolSupply && this.updateMetric({ name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION, labels: null }),
            lumSupply && this.updateMetric({ name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply, labels: null }),
            lumSupply && this.updateMetric({ name: MetricNames.MARKET_CAP, value: lumSupply * lumPrice, labels: null }),
            lumPrice && this.updateMetric({ name: MetricNames.LUM_PRICE_EUR, value: lumPriceEUR, labels: null }),
            lumPrice && this.updateMetric({ name: MetricNames.LUM_PRICE_USD, value: lumPrice, labels: null }),

            // DFR metrics
            dfrApy && this.updateMetric({ name: MetricNames.DFRACT_APY, value: dfrApy, labels: null }),
            dfrBackingPrice && this.updateMetric({ name: MetricNames.DFRACT_BACKING_PRICE, value: dfrBackingPrice, labels: null }),
            dfrSupply && this.updateMetric({ name: MetricNames.DFRACT_CURRENT_SUPPLY, value: dfrSupply, labels: null }),
            dfrMcap && this.updateMetric({ name: MetricNames.DFRACT_MARKET_CAP, value: dfrMcap, labels: null }),
            dfrBalance && this.updateMetric({ name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance, labels: null }),
            newDfrToMint && this.updateMetric({ name: MetricNames.DFRACT_NEW_DFR_TO_MINT, value: newDfrToMint, labels: null }),
            dfrMintRatio && this.updateMetric({ name: MetricNames.DFRACT_MINT_RATIO, value: dfrMintRatio, labels: null }),

            // General metrics
            lumPrice && this.updateMetric({ name: MetricNames.TWITTER_FOLLOWERS, value: lumCommunityData.twitter_followers, labels: null }),
        ]);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async updateMillionsBasic() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`[MillionsBasics] Syncing...`);

        // Acquire list of pools
        let page: Uint8Array | undefined = undefined;
        const pools: Pool[] = [];
        while (true) {
            const lPools = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.pools(page);
            pools.push(...lPools.pools);
            if (lPools.pagination && lPools.pagination.nextKey && lPools.pagination.nextKey.length > 0) {
                page = lPools.pagination.nextKey;
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
        while (true) {
            page = undefined;
            const deposits = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.deposits(page);

            // Increase the given state
            for (const deposit of deposits.deposits) {
                depositMetas[deposit.state]++;
            }

            if (deposits.pagination && deposits.pagination.nextKey && deposits.pagination.nextKey.length > 0) {
                page = deposits.pagination.nextKey;
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
            [WithdrawalState.WITHDRAWAL_STATE_FAILURE]: 0,
        };
        while (true) {
            page = undefined;
            const withdrawals = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.withdrawals(page);

            // Increase the given state
            for (const withdrawal of withdrawals.withdrawals) {
                withdrawalMetas[withdrawal.state]++;
            }

            if (withdrawals.pagination && withdrawals.pagination.nextKey && withdrawals.pagination.nextKey.length > 0) {
                page = withdrawals.pagination.nextKey;
            } else {
                break;
            }
        }

        // Broadcast metrics
        this._logger.debug(`[MillionsBasics] Broadcasting metrics...`);
        for (const pool of pools) {
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_VALUE_LOCKED, value: Number(pool.tvlAmount), labels: { pool_id: pool.poolId.toNumber() } });
            await this.updateMetric({ name: MetricNames.MILLIONS_POOL_DEPOSITORS, value: Number(pool.depositorsCount.toNumber()), labels: { pool_id: pool.poolId.toNumber() } });
        }
        for (const depositState of Object.keys(depositMetas)) {
            await this.updateMetric({ name: MetricNames.MILLIONS_DEPOSITS, value: Number(depositMetas[depositState]), labels: { deposit_state: depositStateToString(Number(depositState)) } });
        }
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
        let page: Uint8Array | undefined = undefined;
        const draws: Draw[] = [];
        while (true) {
            const lDraws = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.queryClient.millions.draws(page);
            draws.push(...lDraws.draws);
            if (lDraws.pagination && lDraws.pagination.nextKey && lDraws.pagination.nextKey.length > 0) {
                page = lDraws.pagination.nextKey;
            } else {
                break;
            }
        }

        // Broadcast metrics
        this._logger.debug(`[MillionsDraws] Metrics acquired, now broadcasting...`);
        for (const draw of draws) {
            // await this.updateMetric({ name: MetricNames.MILLIONS_POOL_PRIZE_AMOUNT, value: Number(draw.totalWinAmount), labels: { pool_id: draw.poolId.toNumber(), draw_id: draw.drawId.toNumber() } });
            // await this.updateMetric({ name: MetricNames.MILLIONS_POOL_PRIZE_WINNERS, value: Number(draw.totalWinCount.toNumber()), labels: { pool_id: draw.poolId.toNumber(), draw_id: draw.drawId.toNumber() } });
        }
        this._logger.debug(`[MillionsDraws] Metrics broadcasted`);
    }
}
