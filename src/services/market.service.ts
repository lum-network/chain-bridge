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
    private _informations: TokenInformation[] = [];
    private _marketCaps: TokenMarketCap[] = [];

    constructor(private readonly _httpService: HttpService) {}

    refreshTokenInformations = async (): Promise<TokenInformation[]> => {
        try {
            const response = await lastValueFrom(this._httpService.get(`${ApiUrl.GET_CHAIN_TOKENS}/all`).pipe(map((response) => response.data)));
            this._informations = response;
            return response;
        } catch (error) {
            return [];
        }
    };

    refreshTokenMarketCaps = async (): Promise<TokenMarketCap[]> => {
        try {
            const data = await lastValueFrom(this._httpService.get(ApiUrl.GET_CHAIN_TOKENS_MCAP).pipe(map((response) => response.data)));
            this._marketCaps = data;
            return data;
        } catch (error) {
            return [];
        }
    };

    getTokenInformation = async (symbol: string, forceRefresh = false): Promise<TokenInformation | undefined> => {
        if (!this._informations.length || forceRefresh) {
            await this.refreshTokenInformations();
        }
        return this._informations.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
    };

    getTokenMarketCap = async (symbol: string, forceRefresh = false): Promise<TokenMarketCap | undefined> => {
        if (!this._marketCaps.length || forceRefresh) {
            await this.refreshTokenMarketCaps();
        }
        return this._marketCaps.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
    };
}
