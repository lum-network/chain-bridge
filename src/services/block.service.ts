import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Between, Repository } from 'typeorm';

import { BlockEntity } from '@app/database';
import { InjectQueue } from '@nestjs/bull';
import { QueueJobs, QueuePriority, Queues } from '@app/utils';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { LumNetworkService } from '@app/services/lum-network.service';

@Injectable()
export class BlockService {
    constructor(
        @InjectRepository(BlockEntity) private readonly _repository: Repository<BlockEntity>,
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
    ) {}

    get repository(): Repository<BlockEntity> {
        return this._repository;
    }

    countTotal = async (): Promise<number> => {
        return this.repository.count();
    };

    fetch = async (skip: number, take: number): Promise<[BlockEntity[], number]> => {
        const query = this._repository.createQueryBuilder('blocks').orderBy('blocks.height', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchByOperatorAddress = async (address: string, skip: number, take: number): Promise<[BlockEntity[], number]> => {
        const query = this._repository.createQueryBuilder('blocks').where('operator_address = :address', { address }).orderBy('blocks.height', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    countInRange = async (start: number, end: number): Promise<number> => {
        return this._repository.count({
            where: {
                height: Between(start, end),
            },
        });
    };

    getLatest = async (): Promise<BlockEntity> => {
        return this._repository.findOne({
            order: {
                height: 'DESC',
            },
            relations: ['transactions'],
        });
    };

    get = async (height: number): Promise<BlockEntity> => {
        return this._repository.findOne({
            where: {
                height,
            },
            relations: ['transactions'],
        });
    };

    save = async (entity: Partial<BlockEntity>): Promise<BlockEntity> => {
        return this._repository.save(entity);
    };

    failSafeIngest = async (height: number) => {
        if (height < this._configService.get<number>('STARTING_HEIGHT')) {
            return;
        }

        const chainId = await this._lumNetworkService.client.getChainId();

        await this._queue.add(
            QueueJobs.INGEST,
            {
                blockHeight: height,
                notify: false,
            },
            {
                jobId: `${chainId}-block-${height}`,
                attempts: 1,
                backoff: 60000,
                priority: QueuePriority.HIGH,
            },
        );
    };
}
