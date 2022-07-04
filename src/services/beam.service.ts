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

    acquireGlobalKpi = async (): Promise<any> => {
        const queryBuilder = this._repository.createQueryBuilder("beams");
        queryBuilder.select("SUM((amount->'amount')::bigint)", 'sum');
        queryBuilder.select("AVG((amount->'amount')::bigint)", 'avg');
        queryBuilder.select("MAX((amount->'amount')::bigint)", 'max')
        return queryBuilder.getRawOne();
    }

    acquireTodayKpi = async (): Promise<any> => {
        //TODO: add date to query
        const queryBuilder = this._repository.createQueryBuilder("beams");
        queryBuilder.select("SUM((amount->'amount')::bigint)", 'sum');
        queryBuilder.select("AVG((amount->'amount')::bigint)", 'avg');
        queryBuilder.select("MAX((amount->'amount')::bigint)", 'max')
        return queryBuilder.getRawOne();
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
