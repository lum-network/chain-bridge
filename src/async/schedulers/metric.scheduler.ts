import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { LumConstants } from '@lum-network/sdk-javascript';
import { Pool } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/pool';
import { Draw } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/draw';
import { DepositState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/deposit';
import { WithdrawalState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/withdrawal';

import { AssetSymbol, CLIENT_PRECISION, makeRequest, MetricNames } from '@app/utils';
import { ChainService, DfractService } from '@app/services';
import { LumChain } from '@app/services/chains';

@Injectable()
export class MetricScheduler {
    constructor(@Inject('API') private readonly _client: ClientProxy, private readonly _configService: ConfigService, private readonly _dfrService: DfractService, private readonly _chainService: ChainService) {}

    // As we rely on external APIs to compute some DFR metrics we trigger the cron every min to avoid rate limiting and error chaining
    @Cron(CronExpression.EVERY_MINUTE)
    async update() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

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
            communityPoolSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION, labels: null }),
            lumSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply, labels: null }),
            lumSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.MARKET_CAP, value: lumSupply * lumPrice, labels: null }),
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_EUR, value: lumPriceEUR, labels: null }),
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_USD, value: lumPrice, labels: null }),

            // DFR metrics
            dfrApy && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_APY, value: dfrApy, labels: null }),
            dfrBackingPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_BACKING_PRICE, value: dfrBackingPrice, labels: null }),
            dfrSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: dfrSupply, labels: null }),
            dfrMcap && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MARKET_CAP, value: dfrMcap, labels: null }),
            dfrBalance && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance, labels: null }),
            newDfrToMint && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_NEW_DFR_TO_MINT, value: newDfrToMint, labels: null }),
            dfrMintRatio && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MINT_RATIO, value: dfrMintRatio, labels: null }),

            // General metrics
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.TWITTER_FOLLOWERS, value: lumCommunityData.twitter_followers, labels: null }),
        ]);
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async updateMillionsBasic() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

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
        for (const pool of pools) {
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_POOL_VALUE_LOCKED, value: Number(pool.tvlAmount), labels: { pool_id: pool.poolId.toNumber() } });
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_POOL_DEPOSITORS, value: Number(pool.depositorsCount.toNumber()), labels: { pool_id: pool.poolId.toNumber() } });
        }
        for (const depositState of Object.keys(depositMetas)) {
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_DEPOSITS, value: Number(depositMetas[depositState]), labels: { deposit_state: depositState } });
        }
        for (const withdrawalState of Object.keys(withdrawalMetas)) {
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_WITHDRAWALS, value: Number(withdrawalMetas[withdrawalState]), labels: { withdrawal_state: withdrawalState } });
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async updateMillionsDraws() {
        if (!this._configService.get<boolean>('METRIC_SYNC_ENABLED')) {
            return;
        }

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
        for (const draw of draws) {
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_POOL_PRIZE_AMOUNT, value: Number(draw.totalWinAmount), labels: { pool_id: draw.poolId.toNumber(), draw_id: draw.drawId.toNumber() } });
            await makeRequest(this._client, 'updateMetric', { name: MetricNames.MILLIONS_POOL_PRIZE_WINNERS, value: Number(draw.totalWinCount.toNumber()), labels: { pool_id: draw.poolId.toNumber(), draw_id: draw.drawId.toNumber() } });
        }
    }
}
