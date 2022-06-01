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

    get = async (hash: string): Promise<any> => {
        return this._repository.findOne({
            where: {
                hash
            }
        });
    };
}
