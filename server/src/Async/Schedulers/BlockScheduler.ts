import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";

import {Queue} from "bull";
import {InjectQueue} from "@nestjs/bull";

import {BlockchainService, ElasticService} from "@app/Services";
import {ElasticIndexes, QueueJobs, Queues} from "@app/Utils/Constants";
import {config} from "@app/Utils/Config";

@Injectable()
export default class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async ingest() {
        // Only ingest if allowed by the configuration
        if(config.getValue<boolean>('INGEST_BLOCKS_ENABLED') === false){
            return;
        }

        // Acquire the ingestion length from config
        const ingestLength = config.getValue<number>('INGEST_BLOCKS_LENGTH');

        // We get the last block stored in ES
        const lastBlock = await ElasticService.getInstance().documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 1,
            sort: {"dispatched_at": "desc"},
            query: {
                match_all: {}
            }
        });
        // Ensure we have all the required data
        if (!lastBlock || !lastBlock.body || !lastBlock.body.hits || !lastBlock.body.hits.hits || lastBlock.body.hits.hits.length !== 1) {
            this._logger.error(`Failed to acquire the last blocked stored in ES`);
            return;
        }
        let lastBlockHeight: number = lastBlock.body.hits.hits[0]['_source']['height'];

        // Get the current status of blockchain
        const currentStatus = await BlockchainService.getInstance().getClient().getStatus();
        if (!currentStatus || !currentStatus.result || !currentStatus.result.sync_info || !currentStatus.result.sync_info.latest_block_height) {
            this._logger.error('Blockchain did not answer to our status call');
            return;
        }
        const currentBlockHeight: number = parseInt(currentStatus.result.sync_info.latest_block_height);

        // If the actual height is the last one, don't do anything (avoiding race condition)
        if (lastBlockHeight == currentBlockHeight) {
            return;
        }

        // We cap the amount of blocks to proceed on that batch (avoiding race condition)
        let blocksToProceed = currentBlockHeight - lastBlockHeight;
        blocksToProceed = (blocksToProceed > ingestLength) ? ingestLength : blocksToProceed;

        // Prepare required boundaries
        this._logger.log(`Syncing from ${lastBlockHeight + 1} to ${lastBlockHeight + blocksToProceed}`);
        const start = lastBlockHeight + 1;
        const end = start + blocksToProceed;

        // Acquire the list of blocks
        const blocks: any = (await BlockchainService.getInstance().getClient().getBlocksBetween(start, end));
        if (!blocks || !blocks.result || !blocks.result.block_metas) {
            this._logger.error(`Unable to get blocks between ${start} and ${end}`);
            return;
        }

        // For each block, push to the processing queue
        for (let bl of blocks.result.block_metas.reverse()) {
            this._queue.add(QueueJobs.INGEST_BLOCK, {
                block_height: bl.header.height,
                num_txs: bl.num_txs
            }).finally(() => {});
        }
    }
}
