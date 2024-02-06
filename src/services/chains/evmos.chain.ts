import { lastValueFrom, map } from 'rxjs';

import { GenericChain } from '@app/services/chains/generic.chain';

import { ApiUrl, apy, computeTotalApy, computeTotalTokenAmount, EVMOS_STAKING_ADDRESS, PERCENTAGE, TEN_EXPONENT_SIX } from '@app/utils';

export class EvmosChain extends GenericChain {
    getAPY = async (): Promise<number> => {
        // Acquire inflation from REST endpoints
        const inflationData = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_INFLATION).pipe(map((response) => response.data)));

        // Compute inflation from the percentage
        const inflation = Number(inflationData.inflation_rate) / PERCENTAGE;

        // Compute APY
        const metrics = await computeTotalApy(this.client, Number(await this.getTokenSupply()), inflation, TEN_EXPONENT_SIX);

        // Acquire inflation params
        const paramsData = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_INFLATION_PARAMS).pipe(map((response) => response.data)));
        const inflationParams = paramsData.params.inflation_distribution;
        return apy(metrics.inflation, Number(inflationParams.usage_incentives) + Number(inflationParams.community_pool), metrics.stakingRatio);
    };

    getTokenSupply = async (): Promise<number> => {
        const data = await lastValueFrom(this.httpService.get(ApiUrl.GET_EVMOS_SUPPLY).pipe(map((response) => response.data)));
        return Number(data.circulating_supply.amount);
    };

    getTotalAllocatedToken = async (): Promise<number> => {
        const tokens = Number(await computeTotalTokenAmount(EVMOS_STAKING_ADDRESS, this.client, this.microDenom, TEN_EXPONENT_SIX));
        return tokens;
    };
}
