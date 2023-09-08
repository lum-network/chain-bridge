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

        if (existingEntity) {
            if (existingEntity.apr < entity.apr) {
                return this._repository.save({
                    ...existingEntity,
                    ...entity,
                    updated_at: entity.created_at,
                });
            }
        } else {
            return this._repository.save({ ...entity, updated_at: entity.created_at });
        }
    };
}
