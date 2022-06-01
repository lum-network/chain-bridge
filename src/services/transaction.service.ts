import {Inject, Injectable} from '@nestjs/common';

import {Repository} from "typeorm";

import {TransactionEntity} from "@app/database";

@Injectable()
export class TransactionService {
    constructor(
        @Inject('TRANSACTION_REPOSITORY') private readonly _repository: Repository<TransactionEntity>
    ) {
    }

    fetch = async (skip: number, take: number): Promise<[TransactionEntity[], number]> => {
        const query = this._repository.createQueryBuilder('transactions').orderBy('transactions.time', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchForAddress = async (address: string): Promise<[TransactionEntity[], number]> => {
        // TODO: implement
        return [[], 0];
    }

    get = async (hash: string): Promise<TransactionEntity> => {
        return this._repository.findOne({
            where: {
                hash
            }
        });
    };

    save = async (entity: Partial<TransactionEntity>): Promise<TransactionEntity> => {
        return this._repository.save(entity);
    }

    saveBulk = async (entities: Partial<TransactionEntity>[]): Promise<TransactionEntity[]> => {
        return this._repository.save(entities);
    }
}
