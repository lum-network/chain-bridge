import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BeamEntity } from '@app/database';
import { BeamStatus, groupTypeToChar, formatDate, groupTypeInterval } from '@app/utils';

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

    sumTotalAmountInRange = async (startAt: Date, endAt: Date, groupType: string): Promise<{ key: string; value: number }[]> => {
        const query = await this._repository.query(`
            SELECT
                to_char(${groupTypeToChar(groupType)}, '${formatDate(groupType)}') AS date,
                (
                    SELECT
                        COALESCE(SUM((amount->'amount')::bigint), 0) as sum
                    FROM
                        beams
                    WHERE
                        id NOTNULL
                        AND dispatched_at >= ${groupTypeToChar(groupType)}
                        AND dispatched_at < ${groupTypeToChar(groupType)} + '1 ${groupTypeInterval(groupType)}'::INTERVAL)
                FROM (
                    SELECT
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(
            groupType,
        )}) ${groupTypeToChar(groupType)}
            GROUP BY
                ${groupTypeToChar(groupType)}
            ORDER BY
                ${groupTypeToChar(groupType)};
        `);

        return query.map((i: { date: Date; sum: bigint }) => ({
            key: String(i.date),
            value: Number(i.sum),
        }));
    };

    countInRange = async (startAt: Date, endAt: Date, groupType: string): Promise<{ key: string; value: number }[]> => {
        const query = await this._repository.query(`
            SELECT
                to_char(${groupTypeToChar(groupType)}, '${formatDate(groupType)}') AS date,
                (
                    SELECT
                        count(*)
                    FROM
                        beams
                    WHERE
                        id NOTNULL
                        AND dispatched_at >= ${groupTypeToChar(groupType)}
                        AND dispatched_at < ${groupTypeToChar(groupType)} + '1 ${groupTypeInterval(groupType)}'::INTERVAL)
                FROM (
                    SELECT
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(
            groupType,
        )}) ${groupTypeToChar(groupType)}
            GROUP BY
                ${groupTypeToChar(groupType)}
            ORDER BY
                ${groupTypeToChar(groupType)};
        `);

        return query.map((i: { date: Date; count: number }) => ({
            key: String(i.date),
            value: Number(i.count),
        }));
    };

    averageTotalAmountInRange = async (startAt: Date, endAt: Date, groupType: string): Promise<{ key: string; value: number }[]> => {
        const query = await this._repository.query(`
            SELECT
                to_char(${groupTypeToChar(groupType)}, '${formatDate(groupType)}') AS date,
                (
                    SELECT
                        AVG((amount->'amount')::bigint)
                    FROM
                        beams
                    WHERE
                        id NOTNULL
                        AND dispatched_at >= ${groupTypeToChar(groupType)}
                        AND dispatched_at < ${groupTypeToChar(groupType)} + '1 ${groupTypeInterval(groupType)}'::INTERVAL)
                FROM (
                    SELECT
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(
            groupType,
        )}) ${groupTypeToChar(groupType)}
            GROUP BY
                ${groupTypeToChar(groupType)}
            ORDER BY
                ${groupTypeToChar(groupType)};
        `);

        return query.map((i: { date: Date; avg: bigint }) => ({
            key: String(i.date),
            value: Number(i.avg || 0),
        }));
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

    failSafeIngest = async (id: string) => {

    }
}
