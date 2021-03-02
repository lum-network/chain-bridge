import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { ElasticService, LumNetworkService } from '@app/Services';
import { QueueJobs, Queues } from '@app/Utils/Constants';
import { config } from '@app/Utils/Config';

@Injectable()
export default class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue, private readonly _elasticService: ElasticService) {}

    @Cron(CronExpression.EVERY_10_SECONDS, { name: 'blocks_live_ingest' })
    async liveIngest() {
        // Only ingest if allowed by the configuration
        if (config.isIngestEnabled() == false) {
            return;
        }

        try {
            // Get singleton lum client
            const lumClt = await LumNetworkService.getClient();
            // Fetch the 20 last blocks
            const lastBlocks = await lumClt.tmClient.blockchain();
            this._logger.debug(`Dispatching last 20 blocks for ingestion at height ${lastBlocks.lastHeight}`)
            for (let i = 0; i < lastBlocks.blockMetas.length; i++) {
                // Push each block into the ingest queue
                const height = lastBlocks.blockMetas[i].header.height;
                this._queue
                    .add(QueueJobs.INGEST_BLOCK, {
                        blockHeight: height,
                    }, {
                        jobId: height,
                        attempts: 3,
                        backoff: 60000,
                    })
                    .finally(() => null);
            }
        } catch (error) {
            this._logger.error(`Failed to dispatch last blocks ingestion:`, error);
        }
    }
}
