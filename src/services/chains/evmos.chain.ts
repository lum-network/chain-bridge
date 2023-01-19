import { GenericChain } from '@app/services/chains/generic.chain';

import { ApiUrl, apy, CLIENT_PRECISION, computeTotalApy, computeTotalTokenAmount, EVMOS_STAKING_ADDRESS, PERCENTAGE } from '@app/utils';

export class EvmosChain extends GenericChain {
    getAPY = async (): Promise<number> => {
        // Acquire inflation from REST endpoints
        const inflationResponse = await fetch(ApiUrl.GET_EVMOS_INFLATION);
        const inflationData = await inflationResponse.json();

        // Compute inflation from the percentage
        const inflation = Number(inflationData.inflation_rate) / PERCENTAGE;

        // Compute APY
        const metrics = await computeTotalApy(this.client, Number(await this.getTokenSupply()), inflation, CLIENT_PRECISION, CLIENT_PRECISION);

        // Acquire inflation params
        const paramsResponse = await fetch(ApiUrl.GET_EVMOS_INFLATION_PARAMS);
        const paramsData = await paramsResponse.json();
        const inflationParams = paramsData.params.inflation_distribution;
        return apy(metrics.inflation, Number(inflationParams.usage_incentives) + Number(inflationParams.community_pool), metrics.stakingRatio);
    };

    getTokenSupply = async (): Promise<number> => {
        const response = await fetch(ApiUrl.GET_EVMOS_SUPPLY);
        const data = await response.json();
        return Number(data.circulating_supply.amount) / CLIENT_PRECISION;
    };

    getTotalAllocatedTokens = async (): Promise<number> => {
        const tokens = Number(await computeTotalTokenAmount(EVMOS_STAKING_ADDRESS, this.client, this.microDenom, CLIENT_PRECISION, CLIENT_PRECISION));
        return tokens;
    };

    getTVL = async (): Promise<number> => {
        return super.getTVL();
    };
}
