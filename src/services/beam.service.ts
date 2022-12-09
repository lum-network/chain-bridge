import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BeamEntity } from '@app/database';
import { BeamStatus, groupTypeToChar, formatDate, groupTypeInterval, Queues, QueuePriority, QueueJobs, BeamEvent } from '@app/utils';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AmountModel } from '@app/database/entities/amount.model';
import { BeamData } from '@lum-network/sdk-javascript/build/codec/beam/beam';

@Injectable()
export class BeamService {
    constructor(@InjectRepository(BeamEntity) private readonly _repository: Repository<BeamEntity>, @InjectQueue(Queues.BEAMS) private readonly _queue: Queue) {}

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

    createOrUpdateBeamEntity = async (
        beamId: string,
        creatorAddress: string,
        status: number,
        claimAddress: string,
        fundsWithdrawn: boolean,
        claimed: boolean,
        cancelReason: string,
        hideContent: boolean,
        schema: string,
        claimExpiresAtBlock: number,
        closesAtBlock: number,
        amount: AmountModel,
        data: BeamData,
        createdAt: Date,
        closedAt: Date,
        event: BeamEvent,
        updatedAt: Date,
    ): Promise<BeamEntity> => {
        let entity = await this.get(beamId);

        // If entity does not exists, we create a new one for BeamEntity
        if (!entity) {
            entity = new BeamEntity({
                creator_address: creatorAddress,
                id: beamId,
                status: status,
                claim_address: claimAddress,
                funds_withdrawn: fundsWithdrawn,
                claimed: claimed,
                cancel_reason: cancelReason,
                hide_content: hideContent,
                schema: schema,
                claim_expires_at_block: claimExpiresAtBlock,
                closes_at_block: closesAtBlock,
                amount,
                data,
                dispatched_at: createdAt,
                closed_at: closedAt,
                event: [event],
            });
        } else {
            // Otherwise, we just update some targeted properties
            entity.status = status;
            entity.claim_address = claimAddress;
            entity.funds_withdrawn = fundsWithdrawn;
            entity.claimed = claimed;
            entity.cancel_reason = cancelReason;
            entity.hide_content = hideContent;
            entity.amount = amount;
            entity.data = data;
            entity.event.push(event);
            entity.updated_at = updatedAt;
        }

        await this._repository.save(entity);

        return entity;
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
