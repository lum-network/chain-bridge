import { Inject, Injectable } from '@nestjs/common';

import { Between, Repository } from 'typeorm';

import { BlockEntity } from '@app/database';

@Injectable()
export class BlockService {
    constructor(@Inject('BLOCK_REPOSITORY') private readonly _repository: Repository<BlockEntity>) {}

    get repository(): Repository<BlockEntity> {
        return this._repository;
    }

    countTotal = async (): Promise<number> => {
        return this.repository.count();
    };

    fetch = async (skip: number, take: number): Promise<[BlockEntity[], number]> => {
        const query = this._repository.createQueryBuilder('blocks').orderBy('blocks.height', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchByOperatorAddress = async (address: string, skip: number, take: number): Promise<[BlockEntity[], number]> => {
        const query = this._repository.createQueryBuilder('blocks').where('operator_address = :address', { address }).orderBy('blocks.height', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    countInRange = async (start: number, end: number): Promise<number> => {
        return this._repository.count({
            where: {
                height: Between(start, end),
            },
        });
    };

    getLatest = async (): Promise<BlockEntity> => {
        return this._repository.findOne({
            order: {
                height: 'DESC',
            },
            relations: ['transactions'],
        });
    };

    get = async (height: number): Promise<BlockEntity> => {
        return this._repository.findOne({
            where: {
                height,
            },
            relations: ['transactions'],
        });
    };

    save = async (entity: Partial<BlockEntity>): Promise<BlockEntity> => {
        return this._repository.save(entity);
    };
}
