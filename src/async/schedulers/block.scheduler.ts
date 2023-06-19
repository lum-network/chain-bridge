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
    constructor(@InjectQueue(Queues.BLOCKS) private readonly _queue: Queue, private readonly _configService: ConfigService, private readonly _chainService: ChainService) {}

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'blocks_backward_ingest' })
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const chainId = this._chainService.getChain<LumChain>(AssetSymbol.LUM).chainId;
        const blockHeight = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: blockHeight,
            },
            {
                priority: QueuePriority.LOW,
            },
        );
    }

    @Cron(CronExpression.EVERY_10_SECONDS, { name: 'blocks_live_ingest' })
    async liveIngest() {
        const chainId = this._chainService.getChain<LumChain>(AssetSymbol.LUM).chainId;
        const lastBlocks = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.tmClient.blockchain();
        this._logger.debug(`Dispatching last 20 blocks for ingestion at height ${lastBlocks.lastHeight}`);

        // For each block, dispatch the ingestion job to the queue
        for (const meta of lastBlocks.blockMetas) {
            const height = meta.header.height;
            await this._queue.add(
                QueueJobs.INGEST,
                {
                    blockHeight: height,
                    notify: true,
                },
                {
                    jobId: `${chainId}-block-${height}`,
                    attempts: 5,
                    backoff: 60000,
                    priority: QueuePriority.HIGH,
                },
            );
        }
    }
}
