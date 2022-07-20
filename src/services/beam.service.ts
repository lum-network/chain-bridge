import {Inject, Injectable} from "@nestjs/common";

import {Repository} from "typeorm";

import {BeamEntity} from "@app/database";
import {BeamStatus} from "@app/utils";

@Injectable()
export class BeamService {
    constructor(
        @Inject('BEAM_REPOSITORY') private readonly _repository: Repository<BeamEntity>
    ) {
    }

    countTotal = async (): Promise<number> => {
        return this._repository.count();
    }

    countByStatus = async (status: BeamStatus): Promise<number> => {
        return this._repository.count({
            where: {
                status: status
            }
        });
    }

    countDifferentCreatorAddresses = async (): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select('creator_address');
        queryBuilder.distinct(true)
        return (await queryBuilder.getRawMany() as any).length;
    }

    sumTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select("SUM((amount->'amount')::bigint)", 'sum');
        if (date) {
            queryBuilder.where('created_at >= :date', {date: date});
        }
        return (await queryBuilder.getRawOne() as any).sum;
    }

    averageTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select("AVG((amount->'amount')::bigint)", 'avg');
        if (date) {
            queryBuilder.where('created_at >= :date', {date: date});
        }
        return (await queryBuilder.getRawOne() as any).avg;
    }

    maxTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select("MAX((amount->'amount')::bigint)", 'max');
        if (date) {
            queryBuilder.where('created_at >= :date', {date: date});
        }
        return (await queryBuilder.getRawOne() as any).max;
    }

    fetch = async (skip: number, take: number): Promise<[BeamEntity[], number]> => {
        const query = this._repository.createQueryBuilder('beams').skip(skip).take(take);
        return query.getManyAndCount();
    }

    get = async (id: string): Promise<BeamEntity> => {
        return this._repository.findOne({
            where: {
                id
            }
        });
    }

    save = async (entity: Partial<BeamEntity>): Promise<BeamEntity> => {
        return this._repository.save(entity);
    }

    saveBulk = async (entities: Partial<BeamEntity>[]): Promise<BeamEntity[]> => {
        return this._repository.save(entities);
    }
}
