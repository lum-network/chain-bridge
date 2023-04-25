import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsPoolsEntity } from '@app/database';
import {BalanceResponse} from "@app/http";

@Injectable()
export class MillionsPoolsService {
    constructor(@InjectRepository(MillionsPoolsEntity) private readonly _repository: Repository<MillionsPoolsEntity>) {}

    get repository(): Repository<MillionsPoolsEntity> {
        return this._repository;
    }

    fetch = async (): Promise<MillionsPoolsEntity[]> => {
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
                id: entity.id,
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
