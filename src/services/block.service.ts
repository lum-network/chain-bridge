import {Inject, Injectable} from '@nestjs/common';

import {Repository} from "typeorm";

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
}
