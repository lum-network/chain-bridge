import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { LumNetworkService } from '@app/Services';
import { QueueJobs, Queues, IngestionDocumentVersion } from '@app/Utils/Constants';
import { config } from '@app/Utils/Config';

@Injectable()
export default class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue, private readonly _lumNetworkService: LumNetworkService) {}

    @Cron(CronExpression.EVERY_5_SECONDS, { name: 'blocks_live_ingest' })
    async liveIngest() {
        // Only ingest if allowed by the configuration
        if (config.isIngestEnabled() == false) {
            return;
        }

        try {
            // Get singleton lum client
            const lumClt = await this._lumNetworkService.getClient();
            const chainId = await lumClt.getChainId();

            // Fetch the 20 last blocks
            const lastBlocks = await lumClt.tmClient.blockchain();
            this._logger.debug(`Dispatching last 20 blocks for ingestion at height ${lastBlocks.lastHeight}`);

            // For each block, dispatch the ingestion job to the queue
            for (const meta of lastBlocks.blockMetas) {
                const height = meta.header.height;
                await this._queue.add(
                    QueueJobs.INGEST_BLOCK,
                    {
                        blockHeight: height,
                        notify: true,
                    },
                    {
                        jobId: `${chainId}-block-${height}-v${IngestionDocumentVersion}`,
                        attempts: 5,
                        backoff: 60000,
                    },
                );
            }
        } catch (error) {
            this._logger.error(`Failed to dispatch last blocks ingestion:`, error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'blocks_backward_ingest' })
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const clt = await this._lumNetworkService.getClient();
        const chainId = await clt.getChainId();
        const blockHeight = await clt.getBlockHeight();
        await this._queue.add(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD, {
            chainId: chainId,
            fromBlock: 1,
            toBlock: blockHeight,
        });
    }
}
