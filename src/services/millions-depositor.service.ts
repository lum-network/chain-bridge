import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsDepositorEntity } from '@app/database';

@Injectable()
export class MillionsDepositorService {
    constructor(@InjectRepository(MillionsDepositorEntity) private readonly _repository: Repository<MillionsDepositorEntity>) {}

    get repository(): Repository<MillionsDepositorEntity> {
        return this._repository;
    }

    fetchByPoolId = async (poolId: number, skip: number, take: number): Promise<[MillionsDepositorEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_depositors').where({ pool_id: poolId }).orderBy('millions_depositors.rank', 'ASC').skip(skip).take(take);

        return query.getManyAndCount();
    };

    getByPoolIdAndAddress = async (poolId: number, address: string): Promise<MillionsDepositorEntity | null> => {
        return this._repository.findOne({ where: { pool_id: poolId, address: address } });
    };

    getByPoolIdAndRank = async (poolId: number, rank: number): Promise<MillionsDepositorEntity | null> => {
        return this._repository.findOne({ where: { pool_id: poolId, rank: rank } });
    };

    save = (entity: Partial<MillionsDepositorEntity>): Promise<MillionsDepositorEntity> => {
        return this._repository.save(entity);
    };

    saveBulk = (entities: Partial<MillionsDepositorEntity>[]): Promise<MillionsDepositorEntity[]> => {
        return this._repository.save(entities);
    };

    deleteByPoolId = async (poolId: number): Promise<void> => {
        await this._repository.delete({ pool_id: poolId });
    };
}
