import { lastValueFrom, map } from 'rxjs';

import { GenericChain } from '@app/services/chains/generic.chain';

import { ApiUrl, apy, CLIENT_PRECISION, computeTotalApy, computeTotalTokenAmount, EVMOS_STAKING_ADDRESS, PERCENTAGE } from '@app/utils';

export class EvmosChain extends GenericChain {
    getAPY = async (): Promise<number> => {
        // Acquire inflation from REST endpoints
        const inflationData = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_INFLATION).pipe(map((response) => response.data)));

        // Compute inflation from the percentage
        const inflation = Number(inflationData.inflation_rate) / PERCENTAGE;

        // Compute APY
        const metrics = await computeTotalApy(this.client, Number(await this.getTokenSupply()), inflation, CLIENT_PRECISION, CLIENT_PRECISION);

        // Acquire inflation params
        const paramsData = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_INFLATION_PARAMS).pipe(map((response) => response.data)));
        const inflationParams = paramsData.params.inflation_distribution;
        return apy(metrics.inflation, Number(inflationParams.usage_incentives) + Number(inflationParams.community_pool), metrics.stakingRatio);
    };

    getTokenSupply = async (): Promise<number> => {
        const data = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_SUPPLY).pipe(map((response) => response.data)));
        return Number(data.circulating_supply.amount) / CLIENT_PRECISION;
    };

    getTotalAllocatedTokens = async (): Promise<number> => {
        const tokens = Number(await computeTotalTokenAmount(EVMOS_STAKING_ADDRESS, this.client, this.microDenom, CLIENT_PRECISION, CLIENT_PRECISION));
        return tokens;
    };
}
