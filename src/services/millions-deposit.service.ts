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
        const query = this._repository
            .createQueryBuilder('millions_deposits')
            .where({ winner_address: Equal(winnerAddress), depositor_address: Not(winnerAddress), withdrawal_id: Equal(0), is_sponsor: Equal(false) })
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

        if (existingEntity === null) {
            return null;
        }

        if (entity.block_height !== undefined && entity.block_height !== null && entity.block_height !== 0) {
            existingEntity.block_height = entity.block_height;
        }
        if (entity.amount !== undefined && entity.amount !== null) {
            existingEntity.amount = entity.amount;
        }
        if (entity.pool_id !== undefined && entity.pool_id !== null && entity.pool_id !== 0) {
            existingEntity.pool_id = entity.pool_id;
        }
        if (entity.depositor_address !== undefined && entity.depositor_address !== null && entity.depositor_address !== '') {
            existingEntity.depositor_address = entity.depositor_address;
        }
        if (entity.winner_address !== undefined && entity.winner_address !== null && entity.depositor_address !== '') {
            existingEntity.winner_address = entity.winner_address;
        }
        if (entity.is_sponsor !== undefined && entity.is_sponsor !== null) {
            existingEntity.is_sponsor = entity.is_sponsor;
        }
        if (entity.withdrawal_id !== undefined && entity.withdrawal_id !== null && entity.withdrawal_id !== 0) {
            existingEntity.withdrawal_id = entity.withdrawal_id;
        }

        return this._repository.save(existingEntity);
    };
}
