import {Logger} from "@nestjs/common";

import {InjectQueue, Process, Processor} from "@nestjs/bull";
import {Job, Queue} from "bull";

import {ElasticIndexes, QueueJobs, Queues} from "@app/Utils/Constants";
import {BlockchainService, ElasticService} from "@app/Services";

import * as utils from "sandblock-chain-sdk-js/dist/utils";
import moment from 'moment';
import {config} from "@app/Utils/Config";

const transformBlockProposerAddress = async (proposer_address: string): Promise<string> => {
    const encodedAddress = utils.encodeAddress(proposer_address, 'sandvalcons').toString();//TODO: prefix in config
    const validator = await ElasticService.getInstance().documentGet(ElasticIndexes.INDEX_VALIDATORS, encodedAddress);
    if (validator && validator.body && validator.body.found) {
        return validator.body['_source']['address_operator'];
    }
    return proposer_address;
}

@Processor(Queues.QUEUE_DEFAULT)
export default class BlockConsumer {
    private readonly _logger: Logger = new Logger(BlockConsumer.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {
    }

    @Process(QueueJobs.INGEST_BLOCK)
    async ingestBlock(job: Job<{ block_height: number, num_txs: number }>) {
        // Only ingest if allowed by the configuration
        if (config.isBlockIngestionEnabled() === false) {
            return;
        }

        // Get block from chain
        const block = await BlockchainService.getInstance().getClient().getBlockAtHeightLive(job.data.block_height);
        if (!block) {
            this._logger.error(`Failed to acquire block at height ${job.data.block_height}`);
            return;
        }

        const payload = {
            chain_id: block.block.header.chain_id,
            hash: block.block_id.hash,
            height: parseInt(block.block.header.height),
            dispatched_at: moment(block.block.header.time).format('yyyy-MM-DD HH:mm:ss'),
            num_txs: job.data.num_txs,
            total_txs: (block && block.block && block.block.data && block.block.data.txs) ? block.block.data.txs.length : 0,
            proposer_address: await transformBlockProposerAddress(block.block.header.proposer_address),
            raw: JSON.stringify(block),
            transactions: []
        }

        // If we have transaction, we append to the payload the decoded txHash to allow further search of it
        if (payload.total_txs > 0) {
            for (let tx of block.block.data.txs) {
                const txHash = utils.decodeTransactionHash(tx);
                payload.transactions.push(txHash);

                // Only ingest if allowed by the configuration
                if (config.getValue<boolean>('INGEST_BLOCKS_ENABLED')) {
                    this._queue.add(QueueJobs.INGEST_TRANSACTION, {transaction_hash: txHash}).finally(() => {
                    });
                }
            }
        }

        // Ingest or update (allow to relaunch the ingest from scratch to ensure we store the correct data)
        if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_BLOCKS, payload.height)) === false) {
            await ElasticService.getInstance().documentCreate(ElasticIndexes.INDEX_BLOCKS, payload.height, payload);
            this._logger.log(`Block #${payload.height} ingested`);
        } else {
            await ElasticService.getInstance().documentUpdate(ElasticIndexes.INDEX_BLOCKS, payload.height, payload);
            this._logger.log(`Block #${payload.height} updated`);
        }
    }
}
