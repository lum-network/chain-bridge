import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

import { CLIENT_PRECISION, makeRequest, MetricNames } from '@app/utils';
import { DfractService, LumNetworkService } from '@app/services';
import { LumConstants } from '@lum-network/sdk-javascript';

@Injectable()
export class MetricScheduler {
    private _logger: Logger = new Logger(MetricScheduler.name);

    constructor(@Inject('API') private readonly _client: ClientProxy, private readonly _dfrService: DfractService, private readonly _lumNetworkService: LumNetworkService) {}

    // As we rely on external APIs to compute some DFR metrics we trigger the cron every 5 min to avoid rate limiting and error chaining
    @Cron(CronExpression.EVERY_5_MINUTES)
    async update() {
        try {
            // Acquire data
            const [lumCommunityPool, lumSupply, lumPrice, dfrApy, dfrBackingPrice, dfrSupply, dfrMcap, dfrBalance, dfrMintRatio, newDfrToMint] = await Promise.all([
                this._lumNetworkService.client.queryClient.distribution.communityPool(),
                this._lumNetworkService.getTokenSupply(),
                this._lumNetworkService.getPrice(),
                this._dfrService.getApy(),
                this._dfrService.getDfrBackingPrice(),
                this._dfrService.getTokenSupply(),
                this._dfrService.getMcap(),
                this._dfrService.getCashInVault(),
                this._dfrService.getDfrMintRatio(),
                this._dfrService.getNewDfrToMint(),
            ]);

            // Compute community pool supply
            const communityPoolSupply = lumCommunityPool.pool.find((coin) => coin.denom === LumConstants.MicroLumDenom);

            await Promise.all([
                // LUM metrics
                makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_MARKET_CAP, value: lumSupply * lumPrice.market_data.current_price.usd }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_EUR, value: lumPrice.market_data.current_price.eur }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_USD, value: lumPrice.market_data.current_price.usd }),

                // DFR metrics
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_APY, value: dfrApy }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_BACKING_PRICE, value: dfrBackingPrice }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: dfrSupply }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MARKET_CAP, value: dfrMcap }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MINT_RATIO, value: dfrMintRatio }),
                makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_NEW_DFR_TO_MINT, value: newDfrToMint }),
                // General metrics
                makeRequest(this._client, 'updateMetric', { name: MetricNames.TWITTER_FOLLOWERS, value: lumPrice.community_data.twitter_followers }),
            ]);
        } catch (error) {
            this._logger.error('Failed to launch the metrics scheduler...', error);
        }
    }
}
