import {Injectable, Logger} from '@nestjs/common';
import {InjectQueue} from '@nestjs/bull';
import {ConfigService} from "@nestjs/config";
import {Cron, CronExpression} from '@nestjs/schedule';

import {Queue} from 'bull';

import {LumNetworkService} from '@app/services';
import {QueueJobs, Queues} from '@app/utils';

@Injectable()
export class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    constructor(@InjectQueue(Queues.QUEUE_BLOCKS) private readonly _queue: Queue, private readonly _configService: ConfigService, private readonly _lumNetworkService: LumNetworkService) {
    }

    @Cron(CronExpression.EVERY_10_SECONDS, {name: 'blocks_live_ingest'})
    async liveIngest() {
        // Only ingest if allowed by the configuration
        if (this._configService.get<boolean>('INGEST_ENABLED') === false) {
            return;
        }

        try {
            // Get singleton lum client
            const chainId = await this._lumNetworkService.client.getChainId();

            // Fetch the 20 last blocks
            const lastBlocks = await this._lumNetworkService.client.tmClient.blockchain();
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
                        jobId: `${chainId}-block-${height}`,
                        attempts: 5,
                        backoff: 60000,
                    },
                );
            }
        } catch (error) {
            this._logger.error(`Failed to dispatch last blocks ingestion:`, error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, {name: 'blocks_backward_ingest'})
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const chainId = await this._lumNetworkService.client.getChainId();
        const blockHeight = await this._lumNetworkService.client.getBlockHeight();
        await this._queue.add(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD, {
            chainId: chainId,
            fromBlock: 1,
            toBlock: blockHeight,
        });
    }
}
