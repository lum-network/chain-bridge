import { LoggerService } from '@nestjs/common';

import { LumClient, LumUtils } from '@lum-network/sdk-javascript';
import { apy, AssetDenom, AssetMicroDenom, CLIENT_PRECISION, computeTotalApy, computeTotalTokenAmount, GenericAssetInfo, LUM_STAKING_ADDRESS, TEN_EXPONENT_SIX } from '@app/utils';
import { AssetService } from '@app/services';

export class GenericChain {
    private readonly _assetService: AssetService;
    private readonly _loggerService: LoggerService;
    private readonly _endpoint: string;
    private readonly _symbol: string;
    private readonly _prefix: string;
    private _client: LumClient;
    private readonly _denom: AssetDenom;
    private readonly _microDenom: AssetMicroDenom;

    constructor(assetService: AssetService, loggService: LoggerService, prefix: string, symbol: string, endpoint: string, denom: AssetDenom, microDenom: AssetMicroDenom) {
        this._assetService = assetService;
        this._loggerService = loggService;
        this._symbol = symbol;
        this._prefix = prefix;
        this._endpoint = endpoint;
        this._denom = denom;
        this._microDenom = microDenom;
    }

    get client(): LumClient {
        return this._client;
    }

    get endpoint(): string {
        return this._endpoint;
    }

    get prefix(): string {
        return this._prefix;
    }

    get symbol(): string {
        return this._symbol;
    }

    get denom(): string {
        return this._denom;
    }

    get microDenom(): string {
        return this._microDenom;
    }

    get assetService(): AssetService {
        return this._assetService;
    }

    get loggerService(): LoggerService {
        return this._loggerService;
    }

    initialize = async (): Promise<LumClient> => {
        this._client = await LumClient.connect(this.endpoint);
        this._loggerService.debug(`Connected to ${this.symbol} chain = ${this.endpoint}`);
        return this._client;
    };

    isInitialized = (): boolean => {
        return this._client !== undefined;
    };

    getTokenInformationFromOsmosis = async (): Promise<any> => {
        try {
            const response = await fetch(`https://api-osmosis.imperator.co/tokens/v2/${this.symbol}`);
            return response.json();
        } catch (error) {
            return null;
        }
    };

    getPrice = async (): Promise<number> => {
        const infos = await this.getTokenInformationFromOsmosis();
        if (!infos) {
            return 0;
        }
        return infos.price;
    };

    getMarketCap = async (): Promise<number> => {
        try {
            const response = await fetch(`https://api-osmosis.imperator.co/tokens/v2/mcap`);
            const data = await response.json();
            const extractedData = data.find((d: any) => d.symbol === this.symbol);
            return extractedData ? extractedData.market_cap : 0;
        } catch (error) {
            return 0;
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const supply = Number((await this.client.getSupply(this._microDenom)).amount) / TEN_EXPONENT_SIX;
            return supply;
        } catch (error) {
            return 0;
        }
    };

    getAPY = async (): Promise<number> => {
        const inflation = Number(await this.client.queryClient.mint.inflation()) / CLIENT_PRECISION;
        const metrics = await computeTotalApy(this.client, Number(await this.getTokenSupply()), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);
        return apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);
    };

    getTotalAllocatedToken = async (): Promise<number> => {
        const decode = LumUtils.Bech32.decode(LUM_STAKING_ADDRESS);
        const getDecodedAddress = LumUtils.Bech32.encode(this.prefix, decode.data);
        return Number(await computeTotalTokenAmount(getDecodedAddress, this.client, this.microDenom, CLIENT_PRECISION, TEN_EXPONENT_SIX));
    };

    getTVL = async (): Promise<number> => {
        const [getTotalPriceDb, getTotalTokenDb] = await Promise.all([this._assetService.getChainServicePrice(), this._assetService.getChainServiceTotalAllocatedToken()]);
        //TODO: implement
        return 0;
    };

    getAssetInfo = async (): Promise<GenericAssetInfo> => {
        try {
            const [supply, price, marketCap, apy, totalAllocatedToken] = await Promise.all([this.getTokenSupply(), this.getPrice(), this.getMarketCap(), this.getAPY(), this.getTotalAllocatedToken()]);
            return {
                supply,
                unit_price_usd: price,
                total_value_usd: marketCap,
                apy,
                total_allocated_token: totalAllocatedToken,
            };
        } catch (error) {
            return null;
        }
    };
}
