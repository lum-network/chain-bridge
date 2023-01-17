import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient, LumUtils } from '@lum-network/sdk-javascript';
import * as Sentry from '@sentry/node';

import { lastValueFrom, map } from 'rxjs';

import {
    ApiUrl,
    apy,
    AssetPrefix,
    AssetSymbol,
    AssetMicroDenom,
    CHAIN_ENV_CONFIG,
    CLIENT_PRECISION,
    EVMOS_STAKING_ADDRESS,
    computeTotalApy,
    computeTotalTokenAmount,
    DfractOnChainApy,
    LUM_STAKING_ADDRESS,
    PERCENTAGE,
    TEN_EXPONENT_SIX,
    GenericAssetInfo,
} from '@app/utils';

import { AssetService } from '@app/services';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private _chainClient: LumClient = null;
    private _client: LumClient[] = [];

    private _assetSymbol = Object.values(AssetSymbol).map((key) => key);
    private _assetMicroDenom = Object.values(AssetMicroDenom).map((key) => key);
    private _dfractOnChainApy = Object.values(DfractOnChainApy).map((key) => key);
    private _dfractPrefix = Object.values(AssetPrefix).map((key) => key);

    constructor(private readonly _assetService: AssetService, private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initialize = async () => {
        try {
            for (const env of CHAIN_ENV_CONFIG) {
                this._chainClient = await LumClient.connect(this._configService.get<string>(env));
                const chainId = await this._chainClient.getChainId();

                this._client.push(this._chainClient);

                this._logger.log(`Connection established to ${env} = ${chainId}`);
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    };

    isInitialized = (): boolean => {
        return this._client.length > 0;
    };

    /*
     * This method returns the list of assets prices we represent in our Dfract index
     * We intentionally remove the LUM ticker as we have our own method to compute the LUM price
     */
    getPrice = async (): Promise<{ unit_price_usd: number; symbol: string }[]> => {
        try {
            const price = await lastValueFrom(this._httpService.get(`${ApiUrl.GET_CHAIN_TOKENS_ALL}`).pipe(map((response) => response.data)));
            if (!price || !price.length) {
                return [];
            }

            return price
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol && el.symbol !== AssetSymbol.LUM))
                .map((el) => ({
                    unit_price_usd: el.price,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch price...`, error);
            Sentry.captureException(error);
            return [];
        }
    };

    /*
     * This method returns the list of assets market caps we represent in our Dfract index
     * We intentionally remove the LUM ticker as we have our own method to compute the LUM price
     */
    getMcap = async (): Promise<{ total_value_usd: number; symbol: string }[]> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`${ApiUrl.GET_CHAIN_TOKENS_MCAP}`).pipe(map((response) => response.data)));
            if (!getMktCap || !getMktCap.length) {
                return [];
            }
            return getMktCap
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol && el.symbol !== AssetSymbol.LUM))
                .map((el) => ({
                    total_value_usd: el.market_cap,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for external chains...`, error);
            Sentry.captureException(error);
            return [];
        }
    };

    getTokenSupply = async (): Promise<{ supply: number; symbol: string }[]> => {
        try {
            // Not all chains have a reliable token supply that we can extract from chain
            // Hence for some, we need to rely on their official endpoint to retrieve it

            // Return token supply based on the microDenum and denum from assets in the index
            const chainSupply = await Promise.all(
                this._client.map(async (el, index) => {
                    const supply = Number((await el.getSupply(this._assetMicroDenom[index])).amount) / TEN_EXPONENT_SIX;

                    return { supply, symbol: this._assetSymbol[index] };
                }),
            );

            // The value returned from Evmos on chain does not seem accurate to us.
            // Hence, we rely on their official documentation endpoint to retrieve the supply
            const evmosSupply = Number(await lastValueFrom(this._httpService.get(`${ApiUrl.GET_EVMOS_SUPPLY}`).pipe(map((response) => response.data.circulating_supply.amount)))) / CLIENT_PRECISION;

            // We map the token supply from the other chains with the one from evmos
            return chainSupply.map(
                (el) =>
                    [
                        {
                            supply: evmosSupply,
                            symbol: AssetSymbol.EVMOS,
                        },
                    ].find((o) => o.symbol === el.symbol) || el,
            );
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for External Chains...`, error);
            Sentry.captureException(error);
            return [];
        }
    };

    getApy = async (): Promise<{ apy: number; symbol: string }[]> => {
        try {
            // As inflation is not retrievable for now for some chain
            // We take the first 5 {atom, akt, cmdx, dvpn, ki} chain as we need to compute the last ones manually for now.
            // Once we can compute the inflation of all chains evenly we integrate them in the getChainApy variable
            const client = this._client.slice(0, this._dfractOnChainApy.length);

            // Chains where inflation is retrievable
            const getChainApy = await Promise.all(
                client.map(async (el, index) => {
                    const inflation = Number(await el.queryClient.mint.inflation()) / CLIENT_PRECISION;

                    const metrics = await computeTotalApy(el, Number((await this.getTokenSupply())[index].supply), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

                    return {
                        apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio),
                        symbol: this._assetSymbol[index],
                    };
                }),
            );

            // Evmos manual inflation calculation
            // We use their official endpoint to retrieve the inflation rate
            const evmosIndex = CHAIN_ENV_CONFIG.findIndex((el) => el === `${AssetSymbol.EVMOS}_NETWORK_ENDPOINT`);
            const evmosInflation = Number(await lastValueFrom(this._httpService.get(`${ApiUrl.GET_EVMOS_INFLATION}`).pipe(map((response) => response.data.inflation_rate)))) / PERCENTAGE;

            const metrics = await computeTotalApy(this._client[evmosIndex], Number((await this.getTokenSupply())[evmosIndex].supply), evmosInflation, CLIENT_PRECISION, CLIENT_PRECISION);

            // To calculate evmos community tax we need to sum-up the usage_incentive and the community_pool
            const inflationParams = await lastValueFrom(this._httpService.get(`${ApiUrl.GET_EVMOS_INFLATION_PARAMS}`).pipe(map((response) => response.data.params.inflation_distribution)));

            const getEvmosApy = {
                apy: apy(metrics.inflation, Number(inflationParams.usage_incentives) + Number(inflationParams.community_pool), metrics.stakingRatio),
                symbol: this._assetSymbol[evmosIndex],
            };

            // Chains for which inflation is not retrievable via the mint module. Hence, we rely on other rpc endpoints to retrieve it.
            const getOsmosisApy = Number(await lastValueFrom(this._httpService.get(`${ApiUrl.GET_OSMOSIS_APY}`).pipe(map((response) => response.data)))) / PERCENTAGE;

            const getJunoApy = Number(await lastValueFrom(this._httpService.get(`${ApiUrl.GET_JUNO_APY}`).pipe(map((response) => response.data)))) / PERCENTAGE;

            const getStargazeApy = Number(await lastValueFrom(this._httpService.get(`${ApiUrl.GET_STARGAZE_APY}`).pipe(map((response) => response.data)))) / PERCENTAGE;

            return [
                ...getChainApy,
                getEvmosApy,
                { apy: getOsmosisApy, symbol: AssetSymbol.OSMOSIS },
                { apy: getJunoApy, symbol: AssetSymbol.JUNO },
                { apy: getStargazeApy, symbol: AssetSymbol.STARGAZE },
            ];
        } catch (error) {
            this._logger.error(`Could not fetch Token Apy for External Chains...`, error);
            Sentry.captureException(error);
            return [];
        }
    };

    /*
     * This method returns the list of allocated tokens
     * NOTE: EVMOS is being computed specifically as it has a different rounding precision
     */
    getTotalAllocatedToken = async (): Promise<{ total_allocated_token: number; symbol: string }[]> => {
        try {
            const evmosIndex = CHAIN_ENV_CONFIG.findIndex((el) => el === `EVMOS_NETWORK_ENDPOINT`);
            // We exclude evmos from the first computation batch
            const clients = this._client.slice(0, evmosIndex);

            const computedTotalToken = await Promise.all(
                clients.map(async (el, index) => {
                    const decode = LumUtils.Bech32.decode(LUM_STAKING_ADDRESS);
                    const getDecodedAddress = LumUtils.Bech32.encode(this._dfractPrefix[index], decode.data);
                    return {
                        total_allocated_token: Number(await computeTotalTokenAmount(getDecodedAddress, el, this._assetMicroDenom[index], CLIENT_PRECISION, TEN_EXPONENT_SIX)),
                        symbol: this._assetSymbol[index],
                    };
                }),
            );

            // We calculate the total token amount for evmos
            const evmosTotalToken = {
                total_allocated_token: Number(await computeTotalTokenAmount(EVMOS_STAKING_ADDRESS, this._client[evmosIndex], this._assetMicroDenom[evmosIndex], CLIENT_PRECISION, CLIENT_PRECISION)),
                symbol: this._assetSymbol[evmosIndex],
            };

            const totalComputedToken = [...computedTotalToken, evmosTotalToken].sort((a, b) => a.symbol.localeCompare(b.symbol));
            return totalComputedToken;
        } catch (error) {
            this._logger.error('Failed to compute total allocated token for External Chain...', error);
            Sentry.captureException(error);
            return [];
        }
    };

    /*
     * This method returns the list of all infos for the external chains
     */
    getAssetInfo = async (): Promise<GenericAssetInfo[]> => {
        try {
            const [unit_price_usd, total_value_usd, supply, apy, totalToken] = await Promise.all([
                this.getPrice(),
                this.getMcap(),
                this.getTokenSupply(),
                this.getApy(),
                this.getTotalAllocatedToken(),
            ]);

            return [unit_price_usd, total_value_usd, supply, apy, totalToken].flat();
        } catch (error) {
            this._logger.error('Failed to compute Asset Info for external chains...', error);
            Sentry.captureException(error);
            return [];
        }
    };

    /*
     * This method returns the TVL for each external chains
     * NOTE: EVMOS is being computed specifically as it cannot be decoded using the utils
     */
    getTvl = async (): Promise<{ tvl: number; symbol: string }[]> => {
        try {
            const [getTotalPriceDb, getTotalTokenDb] = await Promise.all([this._assetService.getChainServicePrice(), this._assetService.getChainServiceTotalAllocatedToken()]);

            if (getTotalPriceDb && getTotalTokenDb) {
                return getTotalTokenDb
                    .sort((a, b) => a.symbol.localeCompare(b.symbol))
                    .map((item, i) => Object.assign({}, item, getTotalPriceDb[i]))
                    .map((el) => ({
                        tvl: Number(el.unit_price_usd) * Number(el.total_allocated_token),
                        symbol: el.symbol,
                    }));
            }

            return [];
        } catch (error) {
            this._logger.error('Failed to compute TVL for External Chain...', error);
            Sentry.captureException(error);
            return [];
        }
    };
}
