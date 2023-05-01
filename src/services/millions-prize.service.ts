import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MillionsPrizeEntity } from '@app/database';
import { Repository } from 'typeorm';

@Injectable()
export class MillionsPrizeService {
    constructor(@InjectRepository(MillionsPrizeEntity) private readonly _repository: Repository<MillionsPrizeEntity>) {}

    get repository(): Repository<MillionsPrizeEntity> {
        return this._repository;
    }

    getById = async (id: number): Promise<MillionsPrizeEntity> => {
        return await this._repository.findOne({ where: { id } });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsPrizeEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_prizes').orderBy('millions_prizes.created_at', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
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
