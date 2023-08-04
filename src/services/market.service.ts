import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';

import { MoreThan, Repository } from 'typeorm';
import { lastValueFrom, map } from 'rxjs';

import { ApiUrl } from '@app/utils';
import { MarketEntity } from '@app/database';

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

    constructor(@InjectRepository(MarketEntity) private readonly _repository: Repository<MarketEntity>, private readonly _httpService: HttpService) {}

    get repository(): Repository<MarketEntity> {
        return this._repository;
    }

    refreshTokenInformations = async (): Promise<TokenInformation[]> => {
        try {
            const response = await lastValueFrom(
                this._httpService
                    .get(`${ApiUrl.GET_CHAIN_TOKENS}/all`, {
                        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
                    })
                    .pipe(map((response) => response.data)),
            );

            this._informations = response;
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
            this._marketCaps = data;
            return data;
        } catch (error) {
            return [];
        }
    };

    getTokenPrice = async (symbol: string, forceRefresh = false): Promise<number> => {
        if (!this._informations.length || forceRefresh) {
            await this.refreshTokenInformations();
        }
        const val = this._informations.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
        if (!val) {
            return 0;
        }
        return val.price;
    };

    getTokenMarketCap = async (symbol: string, forceRefresh = false): Promise<number> => {
        if (!this._marketCaps.length || forceRefresh) {
            await this.refreshTokenMarketCaps();
        }
        const val = this._marketCaps.find((info) => info.symbol.toLowerCase() === symbol.toLowerCase());
        if (!val) {
            return 0;
        }
        return val.market_cap;
    };

    save = async (symbol: string, price: number): Promise<MarketEntity> => {
        const entity = new MarketEntity({
            denom: symbol.toLocaleLowerCase(),
            price,
        });
        return this._repository.save(entity);
    };

    fetchAllMarketData = async (skip: number, take: number): Promise<[MarketEntity[], number]> => {
        const query = this._repository.createQueryBuilder('market').skip(skip).take(take).orderBy('id', 'ASC');
        return query.getManyAndCount();
    };

    fetchMarketDataSinceDate = async (skip: number, take: number, denom: string, date: Date): Promise<[MarketEntity[], number]> => {
        const data = await this._repository.find({
            where: {
                denom: denom.toLocaleLowerCase(),
                created_at: MoreThan(date),
            },
            skip,
            take,
        });
        const totalCount = await this._repository.count({
            where: {
                denom: denom.toLocaleLowerCase(),
                created_at: MoreThan(date),
            },
        });
        return [data, totalCount];
    };

    fetchLatestMarketDataByDenom = async (denom: string): Promise<MarketEntity[]> => {
        const data = await this._repository.find({
            where: {
                denom,
            },
            order: {
                id: 'DESC',
            },
            take: 1,
        });

        return data;
    };
}
