import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import {
    apy,
    CHAIN_ENV_CONFIG,
    CLIENT_PRECISION,
    computeApyMetrics,
    computeTotalAmount,
    DfractOnChainApy,
    DfractAssetSymbol,
    DfractDenum,
    DfractMicroDenum,
    TEN_EXPONENT_SIX,
    PERCENTAGE,
} from '@app/utils';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private _chainClient: LumClient = null;
    private _client: LumClient[] = [];

    private _assetSymbol = Object.values(DfractAssetSymbol).map((key) => key);
    private _assetMicroDenum = Object.values(DfractMicroDenum).map((key) => key);
    private _assetDenum = Object.values(DfractDenum).map((key) => key);
    private _DfractOnChainApy = Object.values(DfractOnChainApy).map((key) => key);

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initialize = async () => {
        try {
            for (const env of CHAIN_ENV_CONFIG) {
                this._chainClient = await LumClient.connect(this._configService.get<string>(env));
                const chainId = await this._chainClient.getChainId();

                this._client.push(this._chainClient);

                this._logger.log(`Connection established to ${env} ${this._configService.get<string>(env)} = ${chainId}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    isInitialized = (): boolean => {
        return this._client !== null;
    };

    get client(): LumClient[] {
        return this._client;
    }

    getPrice = async (): Promise<number> => {
        try {
            // Observable to get the prices and filter with the one we represent in the index
            const price = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/all`).pipe(map((response) => response.data)));

            return price
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol))
                .map((el) => ({
                    symbol: el.symbol,
                    price: el.price,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Price Market Cap...`);
            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            // Observable to get the mcap and filter with the one we represent in the index
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));

            return getMktCap
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol))
                .map((el) => ({
                    total_value_usd: el.market_cap,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for External Chains...`, error);
            return null;
        }
    };

    getTokenSupply = async (): Promise<any> => {
        try {
            // return token supply based on the microDenum and denum from assets in the index
            const chainSupply = await Promise.all(
                this._client.map(async (el, index) => {
                    const supply = Number((await el.getSupply(this._assetMicroDenum[index])).amount) / TEN_EXPONENT_SIX;

                    return { supply, symbol: this._assetDenum[index] };
                }),
            );
            // The value returned from Evmos on chain does not seem accurate to us.
            // Hence, we rely on their official documentation endpoint to retrieve the supply
            const evmosSupply = [
                {
                    supply:
                        Number(
                            await lastValueFrom(
                                this._httpService.get(`https://rest.bd.evmos.org:1317/evmos/inflation/v1/circulating_supply`).pipe(map((response) => response.data.circulating_supply.amount)),
                            ),
                        ) / CLIENT_PRECISION,
                    symbol: 'aevmos',
                },
            ];

            return chainSupply.map((el) => evmosSupply.find((o) => o.symbol === el.symbol) || el);
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for External Chains...`, error);
            return null;
        }
    };

    getApy = async (): Promise<any> => {
        try {
            // As inflation is not retrievable for now for some chain
            // We take the first 5 chain as we need to compute the last one manually for now
            const client = this._client.slice(0, this._DfractOnChainApy.length);

            // Chains where inflation is retrievable
            const getChainApy = await Promise.all(
                client.map(async (el, index) => {
                    const inflation = Number(await el.queryClient.mint.inflation()) / CLIENT_PRECISION;

                    const metrics = await computeApyMetrics(el, Number((await this.getTokenSupply())[index].supply), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

                    return { apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio), symbol: this._assetDenum[index] };
                }),
            );

            // Evmos manual inflation calculation
            // We use their official endpoint to retrieve the inflation rate

            const evmosIndex = CHAIN_ENV_CONFIG.findIndex((el) => el === `${DfractAssetSymbol.EVMOS}_NETWORK_ENDPOINT`);
            const evmosInflation = Number(
                await lastValueFrom(this._httpService.get(`https://rest.bd.evmos.dev:1317/evmos/inflation/v1/inflation_rate`).pipe(map((response) => response.data.inflation_rate))),
            );
            const metrics = await computeApyMetrics(this._client[evmosIndex], Number((await this.getTokenSupply())[evmosIndex].supply), evmosInflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getEvmosApy = { apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio), symbol: this._assetDenum[evmosIndex] };

            // Chains for which inflation is not retrievable via the mint module. Hence, we rely on their official endpoints
            const getOsmosisApy = Number(await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/apr/v2/staking`).pipe(map((response) => response.data)))) / PERCENTAGE;
            const getJunoApy = (await lastValueFrom(this._httpService.get(`https://supply-api.junonetwork.io/apr`).pipe(map((response) => response.data)))) / PERCENTAGE;
            const getStargazeApy = (await lastValueFrom(this._httpService.get(`https://supply-api.publicawesome.dev/apr`).pipe(map((response) => response.data)))) / PERCENTAGE;

            return [
                ...getChainApy,
                getEvmosApy,
                { apy: getOsmosisApy, symbol: DfractDenum.OSMOSIS },
                { apy: getJunoApy, symbol: DfractDenum.JUNO },
                { apy: getStargazeApy, symbol: DfractDenum.STARGAZE },
            ];
        } catch (error) {
            this._logger.error(`Could not fetch Token Apy for External Chains...`, error);
            return null;
        }
    };

    /*     getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }),
            );

            return {
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for AkashNetwork...', error);
            return null;
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('akash', this._chainClient, 'uakt', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for AkashNetwork...', error);
        }
    }; */
}
