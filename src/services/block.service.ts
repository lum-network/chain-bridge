import {Inject, Injectable} from '@nestjs/common';

import {Between, Repository} from "typeorm";

import {BlockEntity} from "@app/database";

@Injectable()
export class BlockService {
    constructor(
        @Inject('BLOCK_REPOSITORY') private readonly _repository: Repository<BlockEntity>
    ) {
    }

    fetch = async (skip: number, take: number): Promise<[BlockEntity[], number]> => {
        const query = this._repository.createQueryBuilder('blocks').orderBy('blocks.height', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    countInRange = async(start: number, end: number): Promise<number> => {
        return this._repository.count({
            where: {
                height: Between(start, end)
            }
        });
    }

    getLatest = async (): Promise<BlockEntity> => {
        //TODO: fetch the transactions as well
        const query = this._repository.createQueryBuilder('blocks').orderBy('blocks.height', 'DESC').take(1);
        return query.getOne();
    };

    get = async (height: number): Promise<BlockEntity> => {
        //TODO: fetch the transactions as well
        return this._repository.findOne({
            where: {
                height
            }
        });
    };

    save = async (entity: BlockEntity): Promise<BlockEntity> => {
        return this._repository.save(entity);
    }
}
