import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as Sentry from '@sentry/node';

import { AssetPrefix, AssetSymbol, AssetMicroDenom, AssetDenom, GenericAssetInfo } from '@app/utils';

import { AssetService } from '@app/services';
import { EvmosChain, GenericChain, LumChain } from '@app/services/chains';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private readonly _clients: { [key: string]: GenericChain } = {};

    constructor(private readonly _assetService: AssetService, private readonly _configService: ConfigService, private readonly _httpService: HttpService) {
        this._clients = {
            [AssetSymbol.COSMOS]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.COSMOS,
                AssetSymbol.COSMOS,
                this._configService.get<string>('COSMOS_NETWORK_ENDPOINT'),
                AssetDenom.COSMOS,
                AssetMicroDenom.COSMOS,
            ),
            [AssetSymbol.AKASH_NETWORK]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.AKASH_NETWORK,
                AssetSymbol.AKASH_NETWORK,
                this._configService.get<string>('AKASH_NETWORK_ENDPOINT'),
                AssetDenom.AKASH_NETWORK,
                AssetMicroDenom.AKASH_NETWORK,
            ),
            [AssetSymbol.COMDEX]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.COMDEX,
                AssetSymbol.COMDEX,
                this._configService.get<string>('COMDEX_NETWORK_ENDPOINT'),
                AssetDenom.COMDEX,
                AssetMicroDenom.COMDEX,
            ),
            [AssetSymbol.SENTINEL]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.SENTINEL,
                AssetSymbol.SENTINEL,
                this._configService.get<string>('SENTINEL_NETWORK_ENDPOINT'),
                AssetDenom.SENTINEL,
                AssetMicroDenom.SENTINEL,
            ),
            [AssetSymbol.KI]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.KI,
                AssetSymbol.KI,
                this._configService.get<string>('KICHAIN_NETWORK_ENDPOINT'),
                AssetDenom.KI,
                AssetMicroDenom.KI,
            ),
            [AssetSymbol.OSMOSIS]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.OSMOSIS,
                AssetSymbol.OSMOSIS,
                this._configService.get<string>('OSMOSIS_NETWORK_ENDPOINT'),
                AssetDenom.OSMOSIS,
                AssetMicroDenom.OSMOSIS,
            ),
            [AssetSymbol.JUNO]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.JUNO,
                AssetSymbol.JUNO,
                this._configService.get<string>('JUNO_NETWORK_ENDPOINT'),
                AssetDenom.JUNO,
                AssetMicroDenom.JUNO,
            ),
            [AssetSymbol.STARGAZE]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.STARGAZE,
                AssetSymbol.STARGAZE,
                this._configService.get<string>('STARGAZE_NETWORK_ENDPOINT'),
                AssetDenom.STARGAZE,
                AssetMicroDenom.STARGAZE,
            ),
            [AssetSymbol.EVMOS]: new EvmosChain(
                this._assetService,
                this._logger,
                AssetPrefix.EVMOS,
                AssetSymbol.EVMOS,
                this._configService.get<string>('EVMOS_NETWORK_ENDPOINT'),
                AssetDenom.EVMOS,
                AssetMicroDenom.EVMOS,
            ),
            [AssetSymbol.LUM]: new LumChain(
                this._assetService,
                this._logger,
                AssetPrefix.LUM,
                AssetSymbol.LUM,
                this._configService.get<string>('LUM_NETWORK_ENDPOINT'),
                AssetDenom.LUM,
                AssetMicroDenom.LUM,
            ),
            [AssetSymbol.DFR]: new GenericChain(
                this._assetService,
                this._logger,
                AssetPrefix.LUM,
                AssetSymbol.DFR,
                this._configService.get<string>('LUM_NETWORK_ENDPOINT'),
                AssetDenom.DFR,
                AssetMicroDenom.DFR,
            ),
        };
    }

    initialize = async () => {
        try {
            for (const chainKey of Object.keys(this._clients)) {
                await this._clients[chainKey].initialize();
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    };

    isInitialized = () => {
        for (const chainKey of Object.keys(this._clients)) {
            if (!this._clients[chainKey].isInitialized()) {
                return false;
            }
        }
        return true;
    };

    getChain = (chainSymbol: AssetSymbol) => {
        return this._clients[chainSymbol];
    };

    /*
     * This method returns the list of assets prices we represent in our Dfract index
     * We intentionally remove the LUM ticker as we have our own method to compute the LUM price
     */
    getPrice = async (): Promise<{ unit_price_usd: number; symbol: string }[]> => {
        const prices: { unit_price_usd: number; symbol: string }[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    unit_price_usd: await chain.getPrice(),
                    symbol: chain.symbol,
                };
            }),
        );
        return prices;
    };

    /*
     * This method returns the list of assets market caps we represent in our Dfract index
     * We intentionally remove the LUM ticker as we have our own method to compute the LUM price
     */
    getMcap = async (): Promise<{ total_value_usd: number; symbol: string }[]> => {
        const marketCaps: { total_value_usd: number; symbol: string }[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    total_value_usd: await chain.getMarketCap(),
                    symbol: chain.symbol,
                };
            }),
        );
        return marketCaps;
    };

    /*
     * This method returns the list of tokens supply for external chains
     * NOTE: EVMOS has a specific endpoint for getting the supply
     */
    getTokenSupply = async (): Promise<{ supply: number; symbol: string }[]> => {
        const tokenSupplies: { supply: number; symbol: string }[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    supply: await chain.getTokenSupply(),
                    symbol: chain.symbol,
                };
            }),
        );
        return tokenSupplies;
    };

    /*
     * This method returns the list of APY for our external chains
     * But not all of them are able to return it, hence why we loop over a selected list of allowed chains
     * NOTE: EVMOS has a specific computation logic
     */
    getApy = async (): Promise<{ apy: number; symbol: string }[]> => {
        const apys: { apy: number; symbol: string }[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    apy: await chain.getAPY(),
                    symbol: chain.symbol,
                };
            }),
        );
        return apys;
    };

    /*
     * This method returns the list of allocated tokens
     * NOTE: EVMOS is being computed specifically as it has a different rounding precision
     */
    getTotalAllocatedToken = async (): Promise<{ total_allocated_token: number; symbol: string }[]> => {
        const totalAllocatedTokens: { total_allocated_token: number; symbol: string }[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    total_allocated_token: await chain.getTotalAllocatedToken(),
                    symbol: chain.symbol,
                };
            }),
        );
        return totalAllocatedTokens;
    };

    /*
     * This method returns the list of all infos for the external chains
     */
    getAssetInfo = async (): Promise<GenericAssetInfo[]> => {
        const assetInfos: GenericAssetInfo[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                return {
                    symbol: chain.symbol,
                    price: await chain.getPrice(),
                    market_cap: await chain.getMarketCap(),
                    token_supply: await chain.getTokenSupply(),
                    apy: await chain.getAPY(),
                    total_allocated_token: await chain.getTotalAllocatedToken(),
                };
            }),
        );
        return assetInfos;
    };

    /*
     * This method returns the TVL for each external chains
     * NOTE: EVMOS is being computed specifically as it cannot be decoded using the utils
     */
    getTvl = async (): Promise<{ tvl: number; symbol: string }[]> => {
        /*try {
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
        }*/
        return [];
    };
}
