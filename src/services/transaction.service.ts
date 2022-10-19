import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";

import {Repository} from "typeorm";

import {TransactionEntity} from "@app/database";

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(TransactionEntity) private readonly _repository: Repository<TransactionEntity>
    ) {
    }

    get repository(): Repository<TransactionEntity> {
        return this._repository;
    }

    countTotal = async (): Promise<number> => {
        return this._repository.count();
    }

    fetch = async (skip: number, take: number): Promise<[TransactionEntity[], number]> => {
        const query = this._repository.createQueryBuilder('transactions').orderBy('transactions.time', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchForAddress = async (address: string, skip: number, take: number): Promise<[TransactionEntity[], number]> => {
        const query = this._repository.createQueryBuilder('transactions').where(':batch = ANY(transactions.addresses)', {batch: address}).skip(skip).take(take);
        return query.getManyAndCount();
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
