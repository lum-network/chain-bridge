import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { lastValueFrom, map } from 'rxjs';

import { ApiUrl } from '@app/utils';

export interface TokenInformation {
    price: number;
    denom: string;
    symbol: string;
    liquidity: number;
    volume_24h: number;
    volume_24h_change: number;
    name: string;
    price_24h_change: number;
    price_7d_change: number;
    exponent: number;
    display: string;
}

export interface TokenMarketCap {
    symbol: string;
    market_cap: number;
}

@Injectable()
export class MarketService {
    constructor(private readonly _httpService: HttpService) {}

    refreshTokenInformations = async (): Promise<TokenInformation[]> => {
        try {
            const response = await lastValueFrom(
                this._httpService
                    .get(`${ApiUrl.GET_CHAIN_TOKENS}/all`, {
                        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
                    })
                    .pipe(map((response) => response.data)),
            );
            return response;
        } catch (error) {
            return [];
        }
    };

    refreshTokenMarketCaps = async (): Promise<TokenMarketCap[]> => {
        try {
            const data = await lastValueFrom(
                this._httpService
                    .get(ApiUrl.GET_CHAIN_TOKENS_MCAP, {
                        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
                    })
                    .pipe(map((response) => response.data)),
            );
            return data;
        } catch (error) {
            return [];
        }
    };

    getTokenPrice = async (price: TokenInformation[], symbol: string): Promise<number> => {
        if (!price || !price.length) {
            return;
        }

        const val = price.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
        if (!val) {
            return 0;
        }
        return val.price;
    };

    getTokenMarketCap = async (mcap: TokenMarketCap[], symbol: string): Promise<number> => {
        if (!mcap || !mcap.length) {
            return;
        }

        const val = mcap.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
        if (!val) {
            return 0;
        }
        return val.market_cap;
    };
}
