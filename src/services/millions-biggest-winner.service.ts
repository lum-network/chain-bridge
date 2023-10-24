import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsBiggestWinnerEntity } from '@app/database';

@Injectable()
export class MillionsBiggestWinnerService {
    constructor(@InjectRepository(MillionsBiggestWinnerEntity) private readonly _repository: Repository<MillionsBiggestWinnerEntity>) {}

    get repository(): Repository<MillionsBiggestWinnerEntity> {
        return this._repository;
    }

    getById = async (id: string): Promise<MillionsBiggestWinnerEntity | null> => {
        return this._repository.findOne({ where: { id } });
    };

    exist = async (id: string): Promise<boolean> => {
        return this._repository.exist({ where: { id } });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsBiggestWinnerEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_biggest_winner').where('millions_biggest_winner.sum_of_deposits > 0').orderBy('millions_biggest_winner.apr', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    createOrUpdateAccordingToApr = async (entity: Partial<MillionsBiggestWinnerEntity>): Promise<MillionsBiggestWinnerEntity> => {
        const existingEntity = await this.getById(entity.id);

        // If the user does not exist, simply persist it
        if (!existingEntity) {
            return this._repository.save(entity);
        }

        // If the entity exists and the APR is lower, do nothing
        if (existingEntity.apr >= entity.apr) {
            return existingEntity;
        }

        // Patch and return the entity
        if (entity.apr !== undefined && entity.apr !== null) {
            existingEntity.apr = entity.apr;
        }
        if (entity.raw_amount !== undefined && entity.raw_amount !== null) {
            existingEntity.raw_amount = entity.raw_amount;
        }
        if (entity.sum_of_deposits !== undefined && entity.sum_of_deposits !== null) {
            existingEntity.sum_of_deposits = entity.sum_of_deposits;
        }
        if (entity.pool_id !== undefined && entity.pool_id !== null) {
            existingEntity.pool_id = entity.pool_id;
        }
        if (entity.created_at_height !== undefined && entity.created_at_height !== null) {
            existingEntity.created_at_height = entity.created_at_height;
        }
        if (entity.denom_native !== undefined && entity.denom_native !== null) {
            existingEntity.denom_native = entity.denom_native;
        }
        if (entity.draw_id !== undefined && entity.draw_id !== null) {
            existingEntity.draw_id = entity.draw_id;
        }
        return this._repository.save(existingEntity);
    };
}
