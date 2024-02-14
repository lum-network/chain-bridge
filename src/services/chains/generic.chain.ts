import { LoggerService } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { lastValueFrom, map } from 'rxjs';
import { ibc, lum } from '@lum-network/sdk-javascript';

import { ApiUrl, AssetDenom, AssetMicroDenom, TEN_EXPONENT_SIX } from '@app/utils';
import { MarketService } from '@app/services';

export type Callback = (instance: any) => void;
export type LumClient = Awaited<ReturnType<typeof lum.ClientFactory.createRPCQueryClient>>;
export type IbcQueryClient = Awaited<ReturnType<typeof ibc.ClientFactory.createRPCQueryClient>>;

interface GenericChainConfig {
    httpService: HttpService;
    marketService: MarketService;
    loggerService: LoggerService;
    prefix: string;
    symbol: string;
    endpoint: string;
    denom: AssetDenom;
    microDenom: AssetMicroDenom;
    subscribeToRPC?: boolean;
    postInitCallback?: Callback;
}

export class GenericChain {
    private readonly _config: GenericChainConfig;
    private _chainId: string;
    private _queryClient: LumClient | null = null;
    private _ibcQueryClient: IbcQueryClient | null = null;

    constructor(config: GenericChainConfig) {
        this._config = config;
    }

    get client(): LumClient | null {
        return this._queryClient;
    }

    get ibcQueryClient(): IbcQueryClient | null {
        return this._ibcQueryClient;
    }

    get endpoint(): string {
        return this._config.endpoint;
    }

    get prefix(): string {
        return this._config.prefix;
    }

    get symbol(): string {
        return this._config.symbol;
    }

    get denom(): string {
        return this._config.denom;
    }

    get microDenom(): string {
        return this._config.microDenom;
    }

    get chainId(): string {
        return this._chainId;
    }

    get httpService(): HttpService {
        return this._config.httpService;
    }

    get marketService(): MarketService {
        return this._config.marketService;
    }

    get loggerService(): LoggerService {
        return this._config.loggerService;
    }

    initialize = async (): Promise<LumClient> => {
        // If we want to connect to RPC WS, we have to patch the connection URI
        const useEndpoint = this._config.subscribeToRPC ? this._config.endpoint.replace('https://', 'wss://').replace('http://', 'ws://') : this._config.endpoint;

        const queryClient = await lum.ClientFactory.createRPCQueryClient({
            rpcEndpoint: useEndpoint,
        });

        const { createRPCQueryClient: createIbcRPCQueryClient } = ibc.ClientFactory;
        const ibcQueryClient = await createIbcRPCQueryClient({
            rpcEndpoint: useEndpoint,
        });

        this._queryClient = queryClient;
        this._ibcQueryClient = ibcQueryClient;

        // Bind and acquire the chain id
        this._chainId = (await queryClient.cosmos.base.tendermint.v1beta1.getNodeInfo()).nodeInfo?.network || 'lum-network-1';

        // If we have a post init callback, just mention it
        this.loggerService.debug(`Connected to ${this.symbol} chain = ${useEndpoint} (${this._chainId})`);
        if (this._config.postInitCallback) {
            this._config.postInitCallback(this);
        }
        return this._queryClient;
    };

    isInitialized = (): boolean => {
        return this._queryClient !== undefined && this._ibcQueryClient !== undefined;
    };

    getTokenInformationFromOsmosis = async (): Promise<any> => {
        try {
            const response = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_CHAIN_TOKENS}/${this.symbol}`).pipe(map((response) => response.data)));
            return response;
        } catch (error) {
            return null;
        }
    };

    getPrice = async (): Promise<number> => {
        const infos = await this.getTokenInformationFromOsmosis();
        if (!infos || !infos.length) {
            return 0;
        }
        return infos[0].price;
    };

    getMarketCap = async (): Promise<number> => {
        try {
            const data = await lastValueFrom(this.httpService.get(ApiUrl.GET_CHAIN_TOKENS_MCAP).pipe(map((response) => response.data)));
            const extractedData = data.find((d: any) => d.symbol === this.symbol);
            return extractedData ? extractedData.market_cap : 0;
        } catch (error) {
            return 0;
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const supply = Number(await this.client.cosmos.bank.v1beta1.totalSupply()) / TEN_EXPONENT_SIX;
            return supply;
        } catch (error) {
            return 0;
        }
    };
}
