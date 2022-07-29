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
            queryBuilder.where('dispatched_at >= :date', {date: date});
        }
        return ((await queryBuilder.getRawOne()) as any).sum;
    }

    sumTotalAmountInRange = async (startAt: Date, endAt: Date): Promise<number> => {
        const query = await this._repository.query(`
            with dates as (
                select generate_series(
                   (date '${startAt}')::timestamp,
                   (date '${endAt}')::timestamp,
                   interval '1 hour'
                 ) as dt
            )
            SELECT d.dt::date::text as day, to_char(d.dt::time,'HH24:MM:SS') as hour, COALESCE(SUM((amount->'amount')::bigint), 0) as sum FROM dates d LEFT JOIN beams b ON b.dispatched_at >= d.dt AND b.dispatched_at < d.dt + interval '1 hour' GROUP BY d.dt ORDER BY d.dt;
        `);
        return query.map((i) => {
            return {
                key: i.day + ' ' + i.hour,
                value: i.sum,
            };
        });
    }

    countInRange = async(startAt: Date, endAt: Date): Promise<number> => {
        const query = await this._repository.query(`
            with dates as (
                select generate_series(
                   (date '${startAt}')::timestamp,
                   (date '${endAt}')::timestamp,
                   interval '1 hour'
                 ) as dt
            )
            SELECT d.dt::date::text as day, to_char(d.dt::time,'HH24:MM:SS') as hour, COUNT(id) as count FROM dates d LEFT JOIN beams b ON b.dispatched_at >= d.dt AND b.dispatched_at < d.dt + interval '1 hour' GROUP BY d.dt ORDER BY d.dt;
        `);
        return query.map((i) => {
            return {
                key: i.day + ' ' + i.hour,
                value: i.count,
            };
        });
    }

    averageTotalAmountInRange = async(startAt: Date, endAt: Date): Promise<number> => {
        const query = await this._repository.query(`
            with dates as (
                select generate_series(
                   (date '${startAt}')::timestamp,
                   (date '${endAt}')::timestamp,
                   interval '1 hour'
                 ) as dt
            )
            SELECT d.dt::date::text as day, to_char(d.dt::time,'HH24:MM:SS') as hour, AVG((amount->'amount')::bigint) as average FROM dates d LEFT JOIN beams b ON b.dispatched_at >= d.dt AND b.dispatched_at < d.dt + interval '1 hour' GROUP BY d.dt ORDER BY d.dt;
        `);
        return query.map((i) => {
            return {
                key: i.day + ' ' + i.hour,
                value: i.average || 0,
            };
        });
    }

    averageTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select("AVG((amount->'amount')::bigint)", 'avg');
        if (date) {
            queryBuilder.where('dispatched_at >= :date', {date: date});
        }
        return (await queryBuilder.getRawOne() as any).avg;
    }

    maxTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder("beams").select("MAX((amount->'amount')::bigint)", 'max');
        if (date) {
            queryBuilder.where('dispatched_at >= :date', {date: date});
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
