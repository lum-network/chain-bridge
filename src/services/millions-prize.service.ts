import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsPrizeEntity } from '@app/database';
import { MarketService, MillionsPoolService } from '@app/services';

@Injectable()
export class MillionsPrizeService {
    constructor(@InjectRepository(MillionsPrizeEntity) private readonly _repository: Repository<MillionsPrizeEntity>, private readonly _marketService: MarketService, private readonly _millionsPoolService: MillionsPoolService) {}

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
        const query = this._repository.createQueryBuilder('millions_prizes').orderBy('millions_prizes.raw_amount * millions_prizes.usd_token_value', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    fetchBiggestByPoolId = async (poolId: string, skip: number, take: number): Promise<[MillionsPrizeEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_prizes').where({ pool_id: poolId }).orderBy('millions_prizes.raw_amount', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    getTotalAmountByPoolId = async (poolId: string): Promise<any> => {
        const query = this._repository.createQueryBuilder('millions_prizes').select('SUM(millions_prizes.raw_amount * millions_prizes.usd_token_value)').where({ pool_id: poolId });

        return query.getRawOne();
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
