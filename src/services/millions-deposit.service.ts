import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Not, Equal } from 'typeorm';

import { MillionsDepositEntity } from '@app/database';

@Injectable()
export class MillionsDepositService {
    constructor(@InjectRepository(MillionsDepositEntity) private readonly _repository: Repository<MillionsDepositEntity>) {}

    get repository(): Repository<MillionsDepositEntity> {
        return this._repository;
    }

    getById = async (id: number): Promise<MillionsDepositEntity> => {
        return this._repository.findOne({ where: { id } });
    };

    exist = async (id: number): Promise<boolean> => {
        return this._repository.exist({ where: { id } });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsDepositEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_deposits').orderBy('millions_deposits.block_height', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    fetchDepositsDrops = async (winnerAddress: string, skip: number, take: number): Promise<[MillionsDepositEntity[], number]> => {
        // FIXME: Add is_sponsor: Equal(true) ?
        const query = this._repository
            .createQueryBuilder('millions_deposits')
            .where({ winner_address: Equal(winnerAddress), depositor_address: Not(winnerAddress), withdrawal_id: Not(0) })
            .orderBy('millions_deposits.block_height', 'DESC')
            .skip(skip)
            .take(take);

        return query.getManyAndCount();
    };

    save = (entity: Partial<MillionsDepositEntity>): Promise<MillionsDepositEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsDepositEntity>[]): Promise<MillionsDepositEntity[]> => {
        return this._repository.save(entities);
    };

    update = async (entity: Partial<MillionsDepositEntity>): Promise<MillionsDepositEntity> => {
        const existingEntity = await this.getById(entity.id);
        existingEntity.id = entity.id;
        existingEntity.block_height = entity.block_height || existingEntity.block_height;
        existingEntity.amount = entity.amount;
        existingEntity.pool_id = entity.pool_id || existingEntity.pool_id;
        existingEntity.depositor_address = entity.depositor_address || existingEntity.depositor_address;
        existingEntity.winner_address = entity.winner_address || existingEntity.winner_address;
        existingEntity.is_sponsor = entity.is_sponsor;
        existingEntity.withdrawal_id = entity.withdrawal_id || existingEntity.withdrawal_id;

        return this._repository.save(existingEntity);
    };
}
