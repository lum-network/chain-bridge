import { HttpService } from '@nestjs/axios';
import { ModulesContainer } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';

import { lastValueFrom } from 'rxjs';
import { Queue } from 'bull';
import * as Sentry from '@sentry/node';

import { AssetPrefix, AssetSymbol, AssetMicroDenom, AssetDenom, GenericAssetInfo, Queues, getUniqueSymbols } from '@app/utils';

import { AssetService } from '@app/services/asset.service';
import { MarketService } from '@app/services/market.service';
import { GenericChain, LumChain } from '@app/services/chains';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private readonly _clients: { [key: string]: GenericChain } = {};

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _assetService: AssetService,
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
        private readonly _marketService: MarketService,
        private readonly _modulesContainer: ModulesContainer,
    ) {
        this._clients[AssetSymbol.LUM] = new LumChain({
            assetService: this._assetService,
            httpService: this._httpService,
            marketService: this._marketService,
            loggerService: this._logger,
            prefix: AssetPrefix.LUM,
            symbol: AssetSymbol.LUM,
            endpoint: this._configService.get<string>('LUM_NETWORK_ENDPOINT'),
            denom: AssetDenom.LUM,
            microDenom: AssetMicroDenom.LUM,
            subscribeToRPC: false,
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
     * This method returns the list of all infos for the external chains
     */
    getAssetInfo = async (): Promise<GenericAssetInfo[]> => {
        const assetInfos: GenericAssetInfo[] | any[] = await Promise.all(
            Object.keys(this._clients).map(async (chainKey) => {
                const chain = this._clients[chainKey];
                const priceByChain = await this._marketService.getTokenPrice(chain.symbol);
                // External provider does not have lum mcap, hence we need to retrieve it from LumChain
                const mcapByChain = chain.symbol !== AssetSymbol.LUM ? await this._marketService.getTokenMarketCap(chain.symbol) : await this.getChain<LumChain>(AssetSymbol.LUM).getMarketCap();

                // Calculate the tvl within the same scope
                const totalAllocatedToken = await chain.getTotalAllocatedToken();
                const computedTvl = priceByChain * totalAllocatedToken;

                return {
                    symbol: chain.symbol,
                    unit_price_usd: priceByChain,
                    total_value_usd: mcapByChain,
                    supply: await chain.getTokenSupply(),
                    apy: await chain.getAPY(),
                    total_allocated_token: totalAllocatedToken,
                    tvl: computedTvl,
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

        // Only keep the last inserted key symbols
        const filteredPriceDb = getUniqueSymbols(getTotalPriceDb);
        const filteredTokenDb = getUniqueSymbols(getTotalTokenDb);

        if (!filteredPriceDb || !filteredTokenDb) {
            return [];
        }

        if (filteredPriceDb.length === 0 || filteredTokenDb.length === 0) {
            return [];
        }

        return filteredTokenDb
            .sort((a, b) => a.symbol.localeCompare(b.symbol))
            .map((item, i) => Object.assign({}, item, filteredPriceDb[i]))
            .map((el) => ({
                tvl: Number(el.unit_price_usd) * Number(el.total_allocated_token),
                symbol: el.symbol,
            }));
    };
}
