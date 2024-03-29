import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Queue } from 'bull';

import { ChainService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol, QueueJobs, QueuePriority, Queues } from '@app/utils';

@Injectable()
export class BlockScheduler {
    private readonly _logger: Logger = new Logger(BlockScheduler.name);
    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _chainService: ChainService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'blocks_backward_ingest' })
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const chainId = this._chainService.getChain<LumChain>(AssetSymbol.LUM).chainId;
        const lastedBlock = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.cosmos.base.tendermint.v1beta1.getLatestBlock();

        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: lastedBlock.block.header.height,
            },
            {
                priority: QueuePriority.LOW,
            },
        );
    }

    @Cron(CronExpression.EVERY_10_SECONDS, { name: 'blocks_live_ingest' })
    async liveIngest() {
        const chainId = this._chainService.getChain<LumChain>(AssetSymbol.LUM).chainId;
        const lastBlock = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.cosmos.base.tendermint.v1beta1.getLatestBlock();

        this._logger.debug(`Dispatching last 20 blocks for ingestion at height ${lastBlock.block.header.height}`);

        for (let i = 0; i < 20; i++) {
            // For each block, dispatch the ingestion job to the queue
            await this._queue.add(
                QueueJobs.INGEST,
                {
                    blockHeight: Number(lastBlock.block.header.height) - i,
                    notify: false,
                },
                {
                    jobId: `${chainId}-block-${Number(lastBlock.block.header.height) - i}`,
                    attempts: 5,
                    backoff: 60000,
                    priority: QueuePriority.HIGH,
                },
            );
        }
    }
}
