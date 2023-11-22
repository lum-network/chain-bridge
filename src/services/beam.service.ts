import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, UpdateResult } from 'typeorm';

import { BeamEntity } from '@app/database';
import { BeamEvent, BeamStatus, groupTypeToChar, formatDate, groupTypeInterval, Queues, QueuePriority, QueueJobs } from '@app/utils';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';

@Injectable()
export class BeamService {
    constructor(
        @InjectRepository(BeamEntity) private readonly _repository: Repository<BeamEntity>,
        @InjectQueue(Queues.BEAMS) private readonly _queue: Queue,
    ) {}

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
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(groupType)}) ${groupTypeToChar(groupType)}
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
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(groupType)}) ${groupTypeToChar(groupType)}
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
                        date_trunc('${groupTypeInterval(groupType)}', generate_series('${startAt}'::DATE, '${endAt}'::DATE, '1 ${groupTypeInterval(groupType)}')) AS ${groupTypeToChar(groupType)}) ${groupTypeToChar(groupType)}
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

    createBeam = async (beam: Partial<BeamEntity>, event: BeamEvent): Promise<BeamEntity> => {
        const entity = new BeamEntity({ ...beam, event: [event] });

        return this._repository.save(entity);
    };

    updateBeam = async (beam: Partial<BeamEntity>): Promise<UpdateResult> => {
        const entity = await this.get(beam.id);

        entity.status = beam.status && beam.status !== entity.status ? beam.status : entity.status;
        entity.claim_address = beam.claim_address && beam.claim_address !== entity.claim_address ? beam.claim_address : entity.claim_address;
        entity.funds_withdrawn = beam.funds_withdrawn && beam.funds_withdrawn !== entity.funds_withdrawn ? beam.funds_withdrawn : entity.funds_withdrawn;
        entity.claimed = beam.claimed && beam.claimed !== entity.claimed ? beam.claimed : entity.claimed;
        entity.cancel_reason = beam.cancel_reason && beam.cancel_reason !== entity.cancel_reason ? beam.cancel_reason : entity.cancel_reason;
        entity.hide_content = beam.hide_content && beam.hide_content !== entity.hide_content ? beam.hide_content : entity.hide_content;
        entity.amount = beam.amount && beam.amount !== entity.amount ? beam.amount : entity.amount;
        entity.data = beam.data && beam.data !== entity.data ? beam.data : entity.data;
        entity.updated_at = new Date();

        return this._repository.update(entity.id, entity);
    };

    updateBeamEvent = async (event: BeamEvent): Promise<UpdateResult> => {
        const entity = await this.get(event.value.id);

        entity.event.push(event);

        return this._repository.update(entity.id, entity);
    };

    failSafeIngest = async (id: string): Promise<Job> => {
        return this._queue.add(
            QueueJobs.INGEST,
            { id },
            {
                priority: QueuePriority.HIGH,
            },
        );
    };
}
