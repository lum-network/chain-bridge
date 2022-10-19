import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ValidatorEntity } from '@app/database';

@Injectable()
export class ValidatorService {
    constructor(@InjectRepository(ValidatorEntity) private readonly _repository: Repository<ValidatorEntity>) {}

    get repository(): Repository<ValidatorEntity> {
        return this._repository;
    }

    getByOperatorAddress = async (operator_address: string): Promise<ValidatorEntity> => {
        return this._repository.findOne({
            where: {
                operator_address,
            },
        });
    };

    getByProposerAddress = async (proposer_address: string): Promise<ValidatorEntity> => {
        return this._repository.findOne({
            where: {
                proposer_address,
            },
        });
    };

    save = (entity: Partial<ValidatorEntity>): Promise<ValidatorEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<ValidatorEntity>[]): Promise<ValidatorEntity[]> => {
        return this._repository.save(entities);
    };

    fetch = async (skip: number, take: number): Promise<[ValidatorEntity[], number]> => {
        const query = this._repository.createQueryBuilder('validators').orderBy('validators.tokens', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchAll = async (): Promise<ValidatorEntity[]> => {
        return this._repository.find();
    };
}
