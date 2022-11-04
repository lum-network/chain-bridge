import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BeamEntity } from '@app/database';
import { BeamStatus, ChartGroupType } from '@app/utils';

@Injectable()
export class BeamService {
    constructor(@InjectRepository(BeamEntity) private readonly _repository: Repository<BeamEntity>) {}

    countTotal = async (): Promise<number> => {
        return this._repository.count();
    };

    countByStatus = async (status: BeamStatus): Promise<number> => {
        return this._repository.count({
            where: {
                status: status,
            },
        });
    };

    countDifferentCreatorAddresses = async (): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder('beams').select('creator_address');
        queryBuilder.distinct(true);
        return ((await queryBuilder.getRawMany()) as any).length;
    };

    sumTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder('beams').select("SUM((amount->'amount')::bigint)", 'sum');
        if (date) {
            queryBuilder.where('dispatched_at >= :date', { date: date });
        }
        return ((await queryBuilder.getRawOne()) as any).sum;
    };

    sumTotalAmountInRange = async (startAt: Date, endAt: Date, monthly = false): Promise<{ key: string; value: number }[]> => {
        const query = await this._repository.query(`
            with dates as (
                select generate_series(
                   (date '${startAt}')::timestamp,
                   (date '${endAt}')::timestamp,
                   interval '1 ${monthly ? 'day' : 'hour'}'
                 ) as dt
            )
            SELECT d.dt::date::text as day, to_char(d.dt::time,'HH24:MM:SS') as hour, COALESCE(SUM((amount->'amount')::bigint), 0) as sum FROM dates d LEFT JOIN beams b ON b.dispatched_at >= d.dt AND b.dispatched_at < d.dt + interval '1 ${
                monthly ? 'day' : 'hour'
            }' GROUP BY d.dt ORDER BY d.dt;
        `);
        return query.map((i) => {
            return {
                key: String(i.day + ' ' + i.hour),
                value: Number(i.sum),
            };
        });
    };

    countInRange = async (startAt: Date, endAt: Date, groupBy: string): Promise<{ key: string; value: number }[]> => {
        const monthOrDate = groupBy === ChartGroupType.GROUP_MONTHLY ? 'month' : 'date';
        const monthOrDay = groupBy === ChartGroupType.GROUP_MONTHLY ? 'month' : 'day';
        const query = await this._repository.query(`
            SELECT
                series.${monthOrDate},
                COUNT(e.id)
            FROM (
                SELECT
                    to_char(${monthOrDay}, 'YYYY-MM-DD') AS ${monthOrDate}
                FROM
                    generate_series('${startAt}'::date, '${endAt}'::date, '1${monthOrDay}') AS ${monthOrDay}) series
                LEFT OUTER JOIN (
                SELECT
                    *
                FROM
                    beams
                WHERE
                    dispatched_at >= '${startAt}'
                    AND dispatched_at <= '${endAt}') AS e ON (series.${monthOrDate} = to_char(e.dispatched_at, 'YYYY-MM-DD'))
            GROUP BY
                series.${monthOrDate}
            ORDER BY
                series.${monthOrDate};

        `);

        return query.map((i) => {
            return {
                key: String(`${i[monthOrDate]}`),
                value: Number(i.count),
            };
        });
    };

    /*     averageTotalAmountInRange = async (startAt: Date, endAt: Date, monthly = false): Promise<{ key: string; value: number }[]> => {
        const query = await this._repository.query(`
            with dates as (
                select generate_series(
                   (date '${startAt}')::timestamp,
                   (date '${endAt}')::timestamp,
                   interval '1 ${monthly ? 'day' : 'hour'}'
                 ) as dt
            )
            SELECT d.dt::date::text as day, to_char(d.dt::time,'HH24:MM:SS') as hour, AVG((amount->'amount')::bigint) as average FROM dates d LEFT JOIN beams b ON b.dispatched_at >= d.dt AND b.dispatched_at < d.dt + interval '1 ${
                monthly ? 'day' : 'hour'
            }' GROUP BY d.dt ORDER BY d.dt;
        `);
        return query.map((i) => {
            return {
                key: String(i.day + ' ' + i.hour),
                value: Number(i.average || 0),
            };
        });
    }; */

    averageTotalAmountInRange = async (startAt: Date, endAt: Date, groupBy: string): Promise<{ key: string; value: number }[]> => {
        const monthOrDate = groupBy === ChartGroupType.GROUP_MONTHLY ? 'month' : 'date';
        const monthOrDay = groupBy === ChartGroupType.GROUP_MONTHLY ? 'month' : 'day';
        const query = await this._repository.query(`
            SELECT
                series.${monthOrDate},
                AVG((amount->'amount')
            FROM (
                SELECT
                    to_char(${monthOrDay}, 'YYYY-MM-DD') AS ${monthOrDate}
                FROM
                    generate_series('${startAt}'::date, '${endAt}'::date, '1${monthOrDay}') AS ${monthOrDay}) series
                LEFT OUTER JOIN (
                SELECT
                    *
                FROM
                    beams
                WHERE
                    dispatched_at >= '${startAt}'
                    AND dispatched_at <= '${endAt}') AS e ON (series.${monthOrDate} = to_char(e.dispatched_at, 'YYYY-MM-DD'))
            GROUP BY
                series.${monthOrDate}
            ORDER BY
                series.${monthOrDate};

        `);
        return query.map((i) => {
            return {
                key: String(i.day + ' ' + i.hour),
                value: Number(i.average || 0),
            };
        });
    };

    averageTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder('beams').select("AVG((amount->'amount')::bigint)", 'avg');
        if (date) {
            queryBuilder.where('dispatched_at >= :date', { date: date });
        }
        return ((await queryBuilder.getRawOne()) as any).avg;
    };

    fetchLastClaimed = async (): Promise<{ key: string; value: number }[]> => {
        const res = await this._repository.find({
            where: {
                status: BeamStatus.CLOSED,
                claimed: true,
            },
            order: {
                dispatched_at: 'DESC',
            },
            take: 5,
        });
        return res.map((i) => {
            return {
                key: String(i.claim_address),
                value: Number(i.amount.amount),
            };
        });
    };

    maxTotalAmount = async (date: Date = null): Promise<number> => {
        const queryBuilder = this._repository.createQueryBuilder('beams').select("MAX((amount->'amount')::bigint)", 'max');
        if (date) {
            queryBuilder.where('dispatched_at >= :date', { date: date });
        }
        return ((await queryBuilder.getRawOne()) as any).max;
    };

    fetch = async (skip: number, take: number): Promise<[BeamEntity[], number]> => {
        const query = this._repository.createQueryBuilder('beams').skip(skip).take(take);
        return query.getManyAndCount();
    };

    get = async (id: string): Promise<BeamEntity> => {
        return this._repository.findOne({
            where: {
                id,
            },
        });
    };

    save = async (entity: Partial<BeamEntity>): Promise<BeamEntity> => {
        return this._repository.save(entity);
    };
}
