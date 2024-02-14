import { HttpService } from '@nestjs/axios';
import { ModulesContainer } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';

import { lastValueFrom } from 'rxjs';
import { Queue } from 'bull';
import * as Sentry from '@sentry/node';

import { AssetPrefix, AssetSymbol, AssetMicroDenom, AssetDenom, Queues } from '@app/utils';

import { MarketService } from '@app/services/market.service';
import { GenericChain, LumChain } from '@app/services/chains';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private readonly _clients: { [key: string]: GenericChain } = {};

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
        private readonly _marketService: MarketService,
        private readonly _modulesContainer: ModulesContainer,
    ) {
        this._clients[AssetSymbol.LUM] = new LumChain({
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
}
