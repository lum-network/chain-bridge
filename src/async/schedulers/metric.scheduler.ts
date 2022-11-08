import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

import { CLIENT_PRECISION, makeRequest, MetricNames } from '@app/utils';
import { LumNetworkService } from '@app/services';
import {LumConstants} from "@lum-network/sdk-javascript";

@Injectable()
export class MetricScheduler {
    constructor(@Inject('API') private readonly _client: ClientProxy, private readonly _lumNetworkService: LumNetworkService) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    async update() {
        // Acquire data
        const [dfrSupply, lumSupply] = await Promise.all([this._lumNetworkService.client.queryClient.bank.supplyOf('udfr'), this._lumNetworkService.client.queryClient.bank.supplyOf(LumConstants.MicroLumDenom)]);
        const [communityPool] = await Promise.all([this._lumNetworkService.client.queryClient.distribution.communityPool()]);
        const [dfrBalance] = await Promise.all([this._lumNetworkService.client.queryClient.dfract.getAccountBalance()]);
        const price = await this._lumNetworkService.getPrice();

        // Compute data
        const communityPoolSupply = communityPool.pool.find((coin) => coin.denom === LumConstants.MicroLumDenom);

        await Promise.all([
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_CURRENT_SUPPLY, value: parseInt(lumSupply.amount, 10) }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: parseInt(dfrSupply.amount, 10) }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.COMMUNITY_POOL_SUPPLY, value: parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.DFRACT_MA_BALANCE, value: dfrBalance.map((balance) => parseInt(balance.amount, 10)).reduce((a, b) => a + b, 0) }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_USD, value: price.data.market_data.current_price.usd }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.LUM_PRICE_EUR, value: price.data.market_data.current_price.eur }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.MARKET_CAP, value: parseInt(lumSupply.amount, 10) * price.data.market_data.current_price.usd }),
            makeRequest(this._client, 'updateMetric', { name: MetricNames.TWITTER_FOLLOWERS, value: price.data.community_data.twitter_followers }),
        ]);
    }
}
