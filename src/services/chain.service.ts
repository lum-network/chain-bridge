import { HttpService } from '@nestjs/axios';
import { ModulesContainer } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';

import { Queue } from 'bull';
import * as Sentry from '@sentry/node';
import { NewBlockEvent } from '@cosmjs/tendermint-rpc';

import { AssetPrefix, AssetSymbol, AssetMicroDenom, AssetDenom, GenericAssetInfo, Queues, QueueJobs, QueuePriority, MODULE_NAMES } from '@app/utils';

import { AssetService } from '@app/services';
import { EvmosChain, GenericChain, LumChain } from '@app/services/chains';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChainService {
    private readonly _currentModuleName: string = null;
    private readonly _logger: Logger = new Logger(ChainService.name);
    private readonly _clients: { [key: string]: GenericChain } = {};

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _assetService: AssetService,
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
        private readonly _modulesContainer: ModulesContainer,
    ) {
        // Lil hack to get the current module name
        for (const nestModule of this._modulesContainer.values()) {
            if (MODULE_NAMES.includes(nestModule.metatype.name)) {
                this._currentModuleName = nestModule.metatype.name;
                break;
            }
        }

        // Only initialize other chains if dfract sync enabled
        if (this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            this._clients[AssetSymbol.COSMOS] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.COSMOS,
                symbol: AssetSymbol.COSMOS,
                endpoint: this._configService.get<string>('COSMOS_NETWORK_ENDPOINT'),
                denom: AssetDenom.COSMOS,
                microDenom: AssetMicroDenom.COSMOS,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.AKASH_NETWORK] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.AKASH_NETWORK,
                symbol: AssetSymbol.AKASH_NETWORK,
                endpoint: this._configService.get<string>('AKASH_NETWORK_ENDPOINT'),
                denom: AssetDenom.AKASH_NETWORK,
                microDenom: AssetMicroDenom.AKASH_NETWORK,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.COMDEX] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.COMDEX,
                symbol: AssetSymbol.COMDEX,
                endpoint: this._configService.get<string>('COMDEX_NETWORK_ENDPOINT'),
                denom: AssetDenom.COMDEX,
                microDenom: AssetMicroDenom.COMDEX,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.SENTINEL] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.SENTINEL,
                symbol: AssetSymbol.SENTINEL,
                endpoint: this._configService.get<string>('SENTINEL_NETWORK_ENDPOINT'),
                denom: AssetDenom.SENTINEL,
                microDenom: AssetMicroDenom.SENTINEL,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.KI] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.KI,
                symbol: AssetSymbol.KI,
                endpoint: this._configService.get<string>('KICHAIN_NETWORK_ENDPOINT'),
                denom: AssetDenom.KI,
                microDenom: AssetMicroDenom.KI,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.OSMOSIS] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.OSMOSIS,
                symbol: AssetSymbol.OSMOSIS,
                endpoint: this._configService.get<string>('OSMOSIS_NETWORK_ENDPOINT'),
                denom: AssetDenom.OSMOSIS,
                microDenom: AssetMicroDenom.OSMOSIS,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.JUNO] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.JUNO,
                symbol: AssetSymbol.JUNO,
                endpoint: this._configService.get<string>('JUNO_NETWORK_ENDPOINT'),
                denom: AssetDenom.JUNO,
                microDenom: AssetMicroDenom.JUNO,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.STARGAZE] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.STARGAZE,
                symbol: AssetSymbol.STARGAZE,
                endpoint: this._configService.get<string>('STARGAZE_NETWORK_ENDPOINT'),
                denom: AssetDenom.STARGAZE,
                microDenom: AssetMicroDenom.STARGAZE,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.EVMOS] = new EvmosChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.EVMOS,
                symbol: AssetSymbol.EVMOS,
                endpoint: this._configService.get<string>('EVMOS_NETWORK_ENDPOINT'),
                denom: AssetDenom.EVMOS,
                microDenom: AssetMicroDenom.EVMOS,
                subscribeToRPC: false,
            });
            this._clients[AssetSymbol.DFR] = new GenericChain({
                assetService: this._assetService,
                httpService: this._httpService,
                loggerService: this._logger,
                prefix: AssetPrefix.LUM,
                symbol: AssetSymbol.DFR,
                endpoint: this._configService.get<string>('LUM_NETWORK_ENDPOINT'),
                denom: AssetDenom.DFR,
                microDenom: AssetMicroDenom.DFR,
                subscribeToRPC: false,
            });
        }

        this._clients[AssetSymbol.LUM] = new LumChain({
            assetService: this._assetService,
            httpService: this._httpService,
            loggerService: this._logger,
            prefix: AssetPrefix.LUM,
            symbol: AssetSymbol.LUM,
            endpoint: this._configService.get<string>('LUM_NETWORK_ENDPOINT'),
            denom: AssetDenom.LUM,
            microDenom: AssetMicroDenom.LUM,
            subscribeToRPC: this._currentModuleName === 'SyncSchedulerModule',
            postInitCallback: (instance) => {
                // Only ingest if allowed by the configuration
                if (this._configService.get<boolean>('INGEST_ENABLED') === false) {
                    return;
                }

                // We only set the block listener in case of the sync scheduler module
                if (this._currentModuleName === 'SyncSchedulerModule') {
                    instance.clientStream.addListener({
                        next: async (ev: NewBlockEvent) => {
                            await this._queue.add(
                                QueueJobs.INGEST,
                                {
                                    blockHeight: ev.header.height,
                                    notify: true,
                                },
                                {
                                    jobId: `${instance.chainId}-block-${ev.header.height}`,
                                    attempts: 5,
                                    backoff: 60000,
                                    priority: QueuePriority.HIGH,
                                },
                            );
                        },
                        error: (err: Error) => {
                            this._logger.error(`Failed to process the block event ${err}`);
                        },
                        complete: () => {
                            this._logger.error(`Stream completed before we had time to process`);
                        },
                    });
                }
            },
        });
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

    isChainInitialized = (chainSymbol: AssetSymbol) => {
        if (!this._clients[chainSymbol]) {
            return false;
        }

        return this._clients[chainSymbol].isInitialized();
    };

    getChain = <Type = GenericChain>(chainSymbol: AssetSymbol): Type => {
        return this._clients[chainSymbol] as Type;
    };

    getIPFSContent = async (cid: string): Promise<any | null> => {
        try {
            return lastValueFrom(
                this._httpService.get(`https://${cid}.ipfs.nftstorage.link/`, {
                    headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
                }),
            );
        } catch (e) {
            return null;
        }
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
     */
    getTvl = async (): Promise<{ tvl: number; symbol: string }[]> => {
        const [getTotalPriceDb, getTotalTokenDb] = await Promise.all([this._assetService.getPrices(), this._assetService.getTotalAllocatedTokens()]);

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
    };
}
