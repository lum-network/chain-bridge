import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsPoolEntity } from '@app/database';

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
