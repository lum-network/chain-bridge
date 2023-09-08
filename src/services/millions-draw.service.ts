import  { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { MillionsDrawEntity } from '@app/database';

@Injectable()
export class MillionsDrawService {
    constructor(@InjectRepository(MillionsDrawEntity) private readonly _repository: Repository<MillionsDrawEntity>) {}

    get repository(): Repository<MillionsDrawEntity> {
        return this._repository;
    }

    getById = async (id: string): Promise<MillionsDrawEntity | null> => {
        return this._repository.findOne({ where: { id } });
    };

    exist = async (id: string): Promise<boolean> => {
        return this._repository.exist({ where: { id } });
    };

    existMoreThan = async (id: string, timeInSec: number): Promise<boolean> => {
        const date = dayjs();
        const dateToCompare = date.subtract(timeInSec, 'second');

        const query = this._repository
            .createQueryBuilder('millions_draws')
            .where('millions_draws.id = :id', { id })
            .andWhere('millions_draws.created_at <= :date', { date: dateToCompare.format('YYYY-MM-DD HH:mm:ss') });

        return query.getExists();
    };

    fetch = async (skip: number, take: number): Promise<[MillionsDrawEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_draws').orderBy('millions_draws.created_at_height', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    save = (entity: Partial<MillionsDrawEntity>): Promise<MillionsDrawEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsDrawEntity>[]): Promise<MillionsDrawEntity[]> => {
        return this._repository.save(entities);
    };

    createOrUpdate = async (entity: Partial<MillionsDrawEntity>): Promise<MillionsDrawEntity> => {
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
