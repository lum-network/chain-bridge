import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsPoolEntity, MillionsPrizeEntity } from '@app/database';
import { MillionsPoolState } from '@app/utils';

@Injectable()
export class MillionsPoolService {
    constructor(@InjectRepository(MillionsPoolEntity) private readonly _repository: Repository<MillionsPoolEntity>) {}

    get repository(): Repository<MillionsPoolEntity> {
        return this._repository;
    }

    getById = async (id: number): Promise<MillionsPoolEntity> => {
        return this._repository.findOne({ where: { id } });
    };

    fetch = async (): Promise<MillionsPoolEntity[]> => {
        return this._repository.find();
    };

    fetchReady = async (): Promise<MillionsPoolEntity[]> => {
        // const query = this._repository
        //     .createQueryBuilder('millions_prizes')
        //     .orderBy('millions_prizes.created_at_height', 'DESC')
        //     .where(`millions_prizes.state = ${MillionsPoolState.READY}`);

        return this._repository.find({ where: { state: MillionsPoolState.READY } });
    };

    save = (entity: Partial<MillionsPoolEntity>): Promise<MillionsPoolEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsPoolEntity>[]): Promise<MillionsPoolEntity[]> => {
        return this._repository.save(entities);
    };

    createOrUpdate = async (entity: Partial<MillionsPoolEntity>): Promise<MillionsPoolEntity> => {
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
