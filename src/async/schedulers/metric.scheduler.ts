import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { LumConstants } from '@lum-network/sdk-javascript';

import { AssetSymbol, CLIENT_PRECISION, makeRequest, MetricNames } from '@app/utils';
import { DfractService, ChainService } from '@app/services';
import { LumChain } from '@app/services/chains';

@Injectable()
export class MetricScheduler {
    private _logger: Logger = new Logger(MetricScheduler.name);

    constructor(
        @Inject('API') private readonly _client: ClientProxy,
        private readonly _configService: ConfigService,
        private readonly _dfrService: DfractService,
        private readonly _chainService: ChainService,
    ) {}

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
            communityPoolSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION }),
            lumSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply }),
            lumSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.MARKET_CAP, value: lumSupply * lumPrice }),
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_EUR, value: lumPriceEUR }),
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_USD, value: lumPrice }),

            // DFR metrics
            dfrApy && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_APY, value: dfrApy }),
            dfrBackingPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_BACKING_PRICE, value: dfrBackingPrice }),
            dfrSupply && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: dfrSupply }),
            dfrMcap && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MARKET_CAP, value: dfrMcap }),
            dfrBalance && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance }),
            newDfrToMint && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_NEW_DFR_TO_MINT, value: newDfrToMint }),
            dfrMintRatio && makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MINT_RATIO, value: dfrMintRatio }),

            // General metrics
            lumPrice && makeRequest(this._client, 'updateMetric', { name: MetricNames.TWITTER_FOLLOWERS, value: lumCommunityData.twitter_followers }),
        ]);
    }
}
