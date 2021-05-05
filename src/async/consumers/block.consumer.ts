import { Logger } from '@nestjs/common';

import { Job, Queue } from 'bull';
import { InjectQueue, Process, Processor } from '@nestjs/bull';

import moment from 'moment';

import { LumUtils, LumRegistry } from '@lum-network/sdk-javascript';

import { ElasticIndexes, NotificationChannels, NotificationEvents, QueueJobs, Queues, IngestionDocumentVersion } from '@app/utils/Constants';
import { BlockDocument, TransactionDocument } from '@app/utils/Models';
import { LumNetworkService, ElasticService } from '@app/services';

import { config } from '@app/utils/Config';

@Processor(Queues.QUEUE_DEFAULT)
export class BlockConsumer {
    private readonly _logger: Logger = new Logger(BlockConsumer.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue, private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService) {}

    @Process(QueueJobs.INGEST_BLOCK)
    async ingestBlock(job: Job<{ blockHeight: number; notify?: boolean }>) {
        // Only ingest if allowed by the configuration
        if (config.isIngestEnabled() === false) {
            return;
        }

        try {
            this._logger.debug(`Ingesting block ${job.data.blockHeight} (attempt ${job.attemptsMade})`);

            // Get singleton lum client
            const lumClt = await this._lumNetworkService.getClient();

            // Get block data
            const block = await lumClt.getBlock(job.data.blockHeight);

            // Get the operator address
            let operatorAddress: string | undefined = undefined;
            try {
                const validatorDoc = await this._elasticService.documentGet(ElasticIndexes.INDEX_VALIDATORS, LumUtils.toHex(block.block.header.proposerAddress).toUpperCase());
                operatorAddress = validatorDoc && validatorDoc.body && validatorDoc.body._source && validatorDoc.body._source.operator_address;
            } catch (error) {
                throw new Error(`Failed to find validator address, exiting for retry (${error})`);
            }

            // Format block data
            const blockDoc: BlockDocument = {
                doc_version: IngestionDocumentVersion,
                chain_id: block.block.header.chainId,
                hash: LumUtils.toHex(block.blockId.hash).toUpperCase(),
                height: block.block.header.height,
                time: moment(block.block.header.time as Date).toISOString(),
                tx_count: block.block.txs.length,
                tx_hashes: block.block.txs.map(tx => LumUtils.toHex(LumUtils.sha256(tx)).toUpperCase()),
                proposer_address: LumUtils.toHex(block.block.header.proposerAddress).toUpperCase(),
                operator_address: operatorAddress,
                raw_block: LumUtils.toJSON(block),
            };

            // Fetch and format transactions data
            const getFormattedTx = async (rawTx: Uint8Array): Promise<TransactionDocument> => {
                // Acquire raw TX
                const tx = await lumClt.getTx(LumUtils.sha256(rawTx));

                // Decode TX to human readable format
                const txData = LumRegistry.decodeTx(tx.tx);

                // Parse the raw logs
                const logs = LumUtils.parseRawLogs(tx.result.log);

                // Build the transaction document from information
                const res: TransactionDocument = {
                    doc_version: IngestionDocumentVersion,
                    chain_id: blockDoc.chain_id,
                    hash: LumUtils.toHex(tx.hash).toUpperCase(),
                    height: tx.height,
                    time: blockDoc.time,
                    block_hash: blockDoc.hash,
                    proposer_address: blockDoc.proposer_address,
                    operator_address: blockDoc.operator_address,
                    success: tx.result.code === 0 && !!tx.result.log,
                    code: tx.result.code,
                    fees: txData.authInfo.fee.amount.map(coin => {
                        return { denom: coin.denom, amount: parseFloat(coin.amount) };
                    }),
                    addresses: [],
                    // TODO: add computed gas fields once made available by the SDK
                    gas_wanted: 0, // tx.result.gasWanted,
                    gas_used: 0, // tx.result.gasUsed,
                    memo: txData.body.memo,
                    messages: txData.body.messages.map(msg => {
                        return { typeUrl: msg.typeUrl, value: LumUtils.toJSON(LumRegistry.decode(msg)) };
                    }),
                    message_type: txData.body.messages.length ? txData.body.messages[0].typeUrl : null,
                    messages_count: txData.body.messages.length,
                    raw_logs: logs as any[],
                    raw_events: tx.result.events.map(ev => LumUtils.toJSON(ev)),
                    raw_tx: LumUtils.toJSON(tx),
                    raw_tx_data: LumUtils.toJSON(txData),
                };

                for (const log of logs) {
                    for (const ev of log.events) {
                        for (const attr of ev.attributes) {
                            if (attr.key === 'sender' || attr.key === 'recipient' || attr.key === 'validator') {
                                if (!res.addresses.includes(attr.value)) {
                                    // Unique addresses
                                    res.addresses.push(attr.value);
                                }
                            } else if (attr.key === 'amount') {
                                const amount = parseFloat(attr.value);
                                const denom = attr.value.substr(amount.toString().length);
                                if (!res.amount || res.amount.amount < amount) {
                                    // Only keep the largest amount (this is definitely an arbitrary choice)
                                    res.amount = { amount, denom };
                                }
                            }
                        }
                    }
                }
                return res;
            };
            const txDocs = await Promise.all(block.block.txs.map(getFormattedTx));

            // Ingest block and transactions into elasticsearch
            const bulkPayload: any[] = [
                {
                    index: {
                        _index: ElasticIndexes.INDEX_BLOCKS,
                        _id: blockDoc.height,
                    },
                },
                blockDoc,
            ];
            for (const txDoc of txDocs) {
                bulkPayload.push({ index: { _index: ElasticIndexes.INDEX_TRANSACTIONS, _id: txDoc.hash } });
                bulkPayload.push(txDoc);
            }
            await this._elasticService.bulkUpdate({ body: bulkPayload });

            if (job.data.notify) {
                // Dispatch notification on websockets for frontend
                await this._queue.add(QueueJobs.NOTIFICATION_SOCKET, {
                    channel: NotificationChannels.CHANNEL_BLOCKS,
                    event: NotificationEvents.EVENT_NEW_BLOCK,
                    data: blockDoc,
                });
            }
        } catch (error) {
            this._logger.error(`Failed to ingest block ${job.data.blockHeight}: ${error}`);
            // Throw error to enforce retry strategy
            throw error;
        }
    }

    @Process(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD)
    async verifyBlocksBackward(job: Job<{ chainId: string; fromBlock: number; toBlock: number }>) {
        this._logger.debug(`Verifying range from block ${job.data.fromBlock} to block ${job.data.toBlock} for chain with id ${job.data.chainId}`);
        const res = await this._elasticService.client.count({
            index: ElasticIndexes.INDEX_BLOCKS,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    chain_id: job.data.chainId,
                                },
                            },
                            {
                                term: {
                                    doc_version: IngestionDocumentVersion,
                                },
                            },
                            {
                                range: {
                                    height: {
                                        gte: job.data.fromBlock,
                                        lte: job.data.toBlock,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });
        this._logger.debug(`Found ${res.body.count}/${job.data.toBlock - job.data.fromBlock} block synced`);
        const missing = job.data.toBlock - job.data.fromBlock - res.body.count;
        if (missing > 0 && job.data.toBlock - job.data.fromBlock <= 1000) {
            // 1000 => block range resync if one block missing
            this._logger.debug(`Trigger block sync for all blocks within [${job.data.fromBlock}, ${job.data.toBlock}]`);
            const jobs = [];
            for (let i = job.data.fromBlock; i <= job.data.toBlock; i++) {
                jobs.push({
                    name: QueueJobs.INGEST_BLOCK,
                    data: { blockHeight: i },
                    opts: {
                        jobId: `${job.data.chainId}-block-${i}-v${IngestionDocumentVersion}`,
                        attempts: 5,
                        backoff: 60000,
                    },
                });
            }
            await this._queue.addBulk(jobs);
        } else if (missing > 0) {
            const r1 = [job.data.fromBlock, job.data.fromBlock + Math.floor((job.data.toBlock - job.data.fromBlock) / 2)];
            const r2 = [r1[1] + 1, job.data.toBlock];
            this._logger.debug(`Trigger block backward check for ranges [${r1[0]}, ${r1[1]}], [${r2[0]}, ${r2[1]}]`);
            await this._queue.add(
                QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
                {
                    chainId: job.data.chainId,
                    fromBlock: r1[0],
                    toBlock: r1[1],
                },
                {
                    attempts: 5,
                    backoff: 60000,
                    jobId: `${job.data.chainId}-check-block-range-${r1[0]}-${r1[1]}-v${IngestionDocumentVersion}`,
                },
            );
            await this._queue.add(
                QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
                {
                    chainId: job.data.chainId,
                    fromBlock: r2[0],
                    toBlock: r2[1],
                },
                {
                    attempts: 5,
                    backoff: 60000,
                    jobId: `${job.data.chainId}-check-block-range-${r2[0]}-${r2[1]}-v${IngestionDocumentVersion}`,
                },
            );
        } else {
            this._logger.debug(`All blocks synced in this range, exiting job.`);
        }
    }
}
