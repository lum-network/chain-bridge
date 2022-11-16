import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

import { CLIENT_PRECISION, makeRequest, MetricNames } from '@app/utils';
import { DfractService, LumNetworkService } from '@app/services';
import { LumConstants } from '@lum-network/sdk-javascript';

@Injectable()
export class MetricScheduler {
    constructor(@Inject('API') private readonly _client: ClientProxy, private readonly _dfrService: DfractService, private readonly _lumNetworkService: LumNetworkService) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    async update() {
        // Acquire data
        const [lumSupply, dfrSupply, dfrApy, dfrBalance, newDfrToMint] = await Promise.all([
            this._lumNetworkService.getTokenSupply(),
            this._dfrService.getTokenSupply(),
            this._dfrService.getApy(),
            this._dfrService.getCashInVault(),
            this._dfrService.getNewDfrToMint(),
        ]);

        const [communityPool] = await Promise.all([this._lumNetworkService.client.queryClient.distribution.communityPool()]);

        const price = await this._lumNetworkService.getPrice();

        // Compute data
        const communityPoolSupply = communityPool.pool.find((coin) => coin.denom === LumConstants.MicroLumDenom);

        await Promise.all([
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: dfrSupply }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_APY, value: dfrApy }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_NEW_DFR_TO_MINT, value: newDfrToMint }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_CURRENT_SUPPLY, value: lumSupply }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_USD, value: price.market_data.current_price.usd }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_EUR, value: price.market_data.current_price.eur }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.MARKET_CAP, value: lumSupply * price.market_data.current_price.usd }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.TWITTER_FOLLOWERS, value: price.community_data.twitter_followers }),
        ]);
    }
}
