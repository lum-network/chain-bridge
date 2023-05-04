import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsPrizeEntity } from '@app/database';
import { MarketService, MillionsPoolService } from '@app/services';
import { AssetMicroDenom, AssetSymbol, getAssetSymbol, getDenomFromSymbol, MillionsPoolState } from '@app/utils';

@Injectable()
export class MillionsPrizeService {
    constructor(
        @InjectRepository(MillionsPrizeEntity) private readonly _repository: Repository<MillionsPrizeEntity>,
        private readonly _marketService: MarketService,
        private readonly _millionsPoolService: MillionsPoolService,
    ) {}

    get repository(): Repository<MillionsPrizeEntity> {
        return this._repository;
    }

    getById = async (id: string): Promise<MillionsPrizeEntity> => {
        return this._repository.findOne({ where: { id } });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsPrizeEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_prizes').orderBy('millions_prizes.created_at_height', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    fetchBiggest = async (skip: number, take: number): Promise<[MillionsPrizeEntity[], number]> => {
        const pools = await this._millionsPoolService.fetchReady();

        // Get all unique symbols from existing pools
        const poolsSymbols = [...new Set(pools.map((pool) => getAssetSymbol(pool.denom_native)))];

        // Get prices for all unique symbols
        const prices = await this._marketService.getTokensPrices(poolsSymbols);

        const pricesMap = new Map(prices.map((price) => [getDenomFromSymbol(price.symbol as AssetSymbol), price.price]));

        console.log(pricesMap);

        const values = Array.from(pricesMap.values());
        const keys = Array.from(pricesMap.keys());

        // const query = this._repository
        //     .createQueryBuilder('millions_prizes')
        //     .where('millions_prizes.denom_native IN (:...denoms)', { denoms: keys })
        //     .orderBy(`millions_prizes.raw_amount * (${values.map((_, index) => `:value${index}`).join(' + ')})`, 'DESC')
        //     .setParameter('values', values)
        //     .skip(skip)
        //     .take(take);

        const query = this._repository.query(`
            SELECT *
            FROM millions_prizes
            WHERE denom_native IN (${keys.map((key, index) => `$${index + 1}`).join(', ')})
            ORDER BY raw_amount * (${values.map((_, index) => `$${keys.length + index + 1}`).join(' + ')}) DESC
            LIMIT 10
        `);

        // const query = this._repository.createQueryBuilder('millions_prizes').orderBy('millions_prizes.raw_amount', 'DESC').skip(skip).take(take);

        // const query = this._repository
        //     .createQueryBuilder('millions_prizes')
        //     .orderBy(`millions_prizes.raw_amount * ${prices.find((price) => price.symbol === AssetSymbol.LUM).price}`, 'DESC')
        //     .skip(skip)
        //     .take(take);

        return query;
    };

    save = (entity: Partial<MillionsPrizeEntity>): Promise<MillionsPrizeEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsPrizeEntity>[]): Promise<MillionsPrizeEntity[]> => {
        return this._repository.save(entities);
    };

    createOrUpdate = async (entity: Partial<MillionsPrizeEntity>): Promise<MillionsPrizeEntity> => {
        const existingEntity = await this.getById(entity.id);

        if (existingEntity) {
            return this._repository.save({
                ...existingEntity,
                ...entity,
            });
        } else {
            return this._repository.save(entity);
        }
    };
}
