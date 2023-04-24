import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MillionsPoolsEntity } from '@app/database';
import { Repository } from 'typeorm';

@Injectable()
export class MillionsPoolsService {
    constructor(@InjectRepository(MillionsPoolsEntity) private readonly _repository: Repository<MillionsPoolsEntity>) {}

    get repository(): Repository<MillionsPoolsEntity> {
        return this._repository;
    }

    fetchAll = async (): Promise<MillionsPoolsEntity[]> => {
        return this._repository.find();
    };

    save = (entity: Partial<MillionsPoolsEntity>): Promise<MillionsPoolsEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsPoolsEntity>[]): Promise<MillionsPoolsEntity[]> => {
        return this._repository.save(entities);
    };

    createOrUpdate = async (entity: Partial<MillionsPoolsEntity>): Promise<MillionsPoolsEntity> => {
        const existingEntity = await this._repository.findOne({
            where: {
                pool_id: entity.pool_id,
            },
        });

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
