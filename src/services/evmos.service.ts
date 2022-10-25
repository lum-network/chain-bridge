import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, DfractAssetName, DfractAssetSymbol, EVMOS_STAKING_ADDRESS, TEN_EXPONENT_SIX } from '@app/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class EvmosService {
    private readonly _logger: Logger = new Logger(EvmosService.name);
    private _evmosClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeEvmos = async () => {
        try {
            this._evmosClient = await LumClient.connect(this._configService.get<string>('EVMOS_NETWORK_ENDPOINT'));
            const chainId = await this._evmosClient.getChainId();
            this._logger.log(`Connection established to Evmos Network on ${this._configService.get<string>('EVMOS_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedEvmos = (): boolean => {
        return this._evmosClient !== null;
    };

    get evmosClient(): LumClient {
        return this._evmosClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/evmos`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Evmos...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.EVMOS).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Evmos...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            // Could not rely on the chain token supply. We went for the official endpoint based on their documentation.
            const getTokenSupply =
                Number(
                    await lastValueFrom(this._httpService.get(`https://rest.bd.evmos.org:1317/evmos/inflation/v1/circulating_supply`).pipe(map((response) => response.data.circulating_supply.amount))),
                ) / CLIENT_PRECISION;

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Evmos...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // Cannot use computeApyMetrics helper function here as inflation is calculated from official endpoint and not directly via chain
            const getBonding = Number((await this.evmosClient.queryClient.staking.pool()).pool.bondedTokens) / TEN_EXPONENT_SIX;
            const getStakingRatio = Number(getBonding) / Number(await this.getTokenSupply());

            // Cannot get inflation via Evmos chain - We rely on their endpoint based on the official documentation
            const getInflation = Number(
                await lastValueFrom(this._httpService.get(`https://rest.bd.evmos.dev:1317/evmos/inflation/v1/inflation_rate`).pipe(map((response) => response.data.inflation_rate))),
            );

            const getCommunityTax = await this.evmosClient.queryClient.distribution.params();

            const getCommunityTaxRate = Number(getCommunityTax.params.communityTax) / CLIENT_PRECISION;

            const getApy = apy(getInflation, getCommunityTaxRate, getStakingRatio);

            return getApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Evmos...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }),
            );

            return {
                name: DfractAssetName.EVMOS,
                symbol: DfractAssetSymbol.EVMOS,
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Evmos...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const page: Uint8Array | undefined = undefined;
            // Helper function computeTotalAmount() we manually inject the delegator address

            const [balance, rewards, delegationResponses, unbondingResponses] = await Promise.all([
                await this.evmosClient.getBalance(EVMOS_STAKING_ADDRESS, 'aevmos'),
                await this.evmosClient.queryClient.distribution.delegationTotalRewards(EVMOS_STAKING_ADDRESS),
                await this.evmosClient.queryClient.staking.delegatorDelegations(EVMOS_STAKING_ADDRESS, page),
                await this.evmosClient.queryClient.staking.delegatorUnbondingDelegations(EVMOS_STAKING_ADDRESS, page),
            ]);

            const getBalance = Number(balance.amount) || 0;

            console.log('getBalance', getBalance);

            const getStakingRewards = Number(rewards.rewards.map((el) => el.reward.filter((el) => el.denom === 'aevmos'))[0].map((el) => el.amount)) / CLIENT_PRECISION;

            console.log('getStakingRewards', getStakingRewards);

            const getDelegationReward = Number(delegationResponses.delegationResponses.map((el) => Number(el.balance.amount)));

            console.log('getDelegationReward', getDelegationReward);

            const getUnbondingDelegation = Number(unbondingResponses.unbondingResponses.map((el) => el.entries.map((el) => el.balance))) || 0;

            console.log('getUnbondingDelegation', getUnbondingDelegation);

            const totalToken = (Number(getStakingRewards) + Number(getUnbondingDelegation) + Number(getBalance) + Number(getDelegationReward)) / CLIENT_PRECISION;

            console.log('totalToken', totalToken);

            const computedTvl = totalToken * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Evmos...', error);
        }
    };
}
