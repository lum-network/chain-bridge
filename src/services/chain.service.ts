import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient, LumUtils } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import {
    apy,
    CHAIN_ENV_CONFIG,
    CLIENT_PRECISION,
    computeTotalApy,
    computeTotalTokenAmount,
    DfractOnChainApy,
    AssetSymbol,
    AssetMicroDenum,
    TEN_EXPONENT_SIX,
    PERCENTAGE,
    AssetPrefix,
    LUM_STAKING_ADDRESS,
    EVMOS_STAKING_ADDRESS,
} from '@app/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private _chainClient: LumClient = null;
    private _client: LumClient[] = [];

    private _assetSymbol = Object.values(AssetSymbol).map((key) => key);
    private _assetMicroDenum = Object.values(AssetMicroDenum).map((key) => key);
    private _dfractOnChainApy = Object.values(DfractOnChainApy).map((key) => key);
    private _dfractPrefix = Object.values(AssetPrefix).map((key) => key);

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

    getPrice = async (): Promise<{ unit_price_usd: number; symbol: string }[]> => {
        try {
            // Observable to get the prices and filter with the one we represent in the index
            const price = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/all`).pipe(map((response) => response.data)));

            return price
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol && el.symbol !== AssetSymbol.LUM))
                .map((el) => ({
                    unit_price_usd: el.price,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Price Price...`, error);
            return null;
        }
    };

    getMcap = async (): Promise<{ total_value_usd: number; symbol: string }[]> => {
        try {
            // Observable to get the mcap and filter with the one we represent in the index
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));

            return getMktCap
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol && el.symbol !== AssetSymbol.LUM))
                .map((el) => ({
                    total_value_usd: el.market_cap,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for External Chains...`, error);
            return null;
        }
    };

    getTokenSupply = async (): Promise<{ supply: number; symbol: string }[]> => {
        try {
            // return token supply based on the microDenum and denum from assets in the index
            const chainSupply = await Promise.all(
                this._client.map(async (el, index) => {
                    const supply = Number((await el.getSupply(this._assetMicroDenum[index])).amount) / TEN_EXPONENT_SIX;

                    return { supply, symbol: this._assetSymbol[index] };
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
                    symbol: AssetSymbol.EVMOS,
                },
            ];

            return chainSupply.map((el) => evmosSupply.find((o) => o.symbol === el.symbol) || el);
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for External Chains...`, error);
            return null;
        }
    };

    getApy = async (): Promise<{ apy: number; symbol: string }[]> => {
        try {
            // As inflation is not retrievable for now for some chain
            // We take the first 5 chain as we need to compute the last one manually for now
            // Once we can compute the inflation of all chains evenly we integrate them in the getChainApy variable
            const client = this._client.slice(0, this._dfractOnChainApy.length);

            // Chains where inflation is retrievable
            const getChainApy = await Promise.all(
                client.map(async (el, index) => {
                    const inflation = Number(await el.queryClient.mint.inflation()) / CLIENT_PRECISION;

                    const metrics = await computeTotalApy(el, Number((await this.getTokenSupply())[index].supply), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

                    return { apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio), symbol: this._assetSymbol[index] };
                }),
            );

            // Evmos manual inflation calculation
            // We use their official endpoint to retrieve the inflation rate
            const evmosIndex = CHAIN_ENV_CONFIG.findIndex((el) => el === `${AssetSymbol.EVMOS}_NETWORK_ENDPOINT`);
            const evmosInflation = Number(
                await lastValueFrom(this._httpService.get(`https://rest.bd.evmos.dev:1317/evmos/inflation/v1/inflation_rate`).pipe(map((response) => response.data.inflation_rate))),
            );
            const metrics = await computeTotalApy(this._client[evmosIndex], Number((await this.getTokenSupply())[evmosIndex].supply), evmosInflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getEvmosApy = { apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio), symbol: this._assetSymbol[evmosIndex] };

            // Chains for which inflation is not retrievable via the mint module. Hence, we rely on their official endpoints
            const getOsmosisApy = Number(await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/apr/v2/staking`).pipe(map((response) => response.data)))) / PERCENTAGE;
            const getJunoApy = Number(await lastValueFrom(this._httpService.get(`https://supply-api.junonetwork.io/apr`).pipe(map((response) => response.data)))) / PERCENTAGE;
            const getStargazeApy = Number(await lastValueFrom(this._httpService.get(`https://supply-api.publicawesome.dev/apr`).pipe(map((response) => response.data)))) / PERCENTAGE;

            return [
                ...getChainApy,
                getEvmosApy,
                { apy: getOsmosisApy, symbol: AssetSymbol.OSMOSIS },
                { apy: getJunoApy, symbol: AssetSymbol.JUNO },
                { apy: getStargazeApy, symbol: AssetSymbol.STARGAZE },
            ];
        } catch (error) {
            this._logger.error(`Could not fetch Token Apy for External Chains...`, error);
            return null;
        }
    };

    getTokenInfo = async (): Promise<TokenInfo[]> => {
        try {
            return await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(([unit_price_usd, total_value_usd, supply, apy]) =>
                [unit_price_usd, total_value_usd, supply, apy].flat(),
            );
        } catch (error) {
            this._logger.error('Failed to compute Token Info for External Chain...', error);
            return null;
        }
    };

    getTvl = async (): Promise<{ tvl: number; symbol: string }[]> => {
        try {
            // We need to compute the tvl differently for evmos as the Lum decode is not working
            // So we exclude evmos from the first batch
            const evmosIndex = CHAIN_ENV_CONFIG.findIndex((el) => el === `${AssetSymbol.EVMOS}_NETWORK_ENDPOINT`);
            const client = this._client.slice(0, evmosIndex);
            const getTotalPrice = (await this.getPrice()).sort((a, b) => a.symbol.localeCompare(b.symbol));

            const computedTotalToken = await Promise.all(
                client.map(async (el, index) => {
                    const decode = LumUtils.Bech32.decode(LUM_STAKING_ADDRESS);
                    const getDecodedAddress = LumUtils.Bech32.encode(this._dfractPrefix[index], decode.data);
                    return {
                        total_token: Number(await computeTotalTokenAmount(getDecodedAddress, el, this._assetMicroDenum[index], CLIENT_PRECISION, TEN_EXPONENT_SIX)),
                        symbol: this._assetSymbol[index],
                    };
                }),
            );

            // We calculate for evmos
            const evmosTotalToken = {
                total_token: Number(await computeTotalTokenAmount(EVMOS_STAKING_ADDRESS, this._client[evmosIndex], this._assetMicroDenum[evmosIndex], CLIENT_PRECISION, CLIENT_PRECISION)),
                symbol: this._assetSymbol[evmosIndex],
            };

            const totalComputedToken = [...computedTotalToken, evmosTotalToken].sort((a, b) => a.symbol.localeCompare(b.symbol));

            return totalComputedToken
                .map((item, i) => Object.assign({}, item, getTotalPrice[i]))
                .map((el) => ({
                    tvl: Number(el.unit_price_usd) * Number(el.total_token),
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error('Failed to compute TVL for External Chain...', error);
        }
    };
}
