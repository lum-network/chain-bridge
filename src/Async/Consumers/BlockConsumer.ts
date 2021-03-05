import { Logger } from '@nestjs/common';

import { Job, Queue } from 'bull';
import { InjectQueue, Process, Processor } from '@nestjs/bull';

import moment from 'moment';

import { LumUtils, LumRegistry } from '@lum-network/sdk-javascript';

import { ElasticIndexes, NotificationChannels, NotificationEvents, QueueJobs, Queues } from '@app/Utils/Constants';
import { BlockDocument, TransactionDocument } from '@app/Utils/Models';
import { LumNetworkService, ElasticService } from '@app/Services';

import { config } from '@app/Utils/Config';

@Processor(Queues.QUEUE_DEFAULT)
export default class BlockConsumer {
    private readonly _logger: Logger = new Logger(BlockConsumer.name);

    constructor(
        @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue,
        private readonly _elasticService: ElasticService,
        private readonly _lumNetworkService: LumNetworkService,
    ) {
    }

    @Process(QueueJobs.INGEST_BLOCK)
    async ingestBlock(job: Job<{ blockHeight: number }>) {
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
            const bulkPayload: any[] = [{
                index: {
                    _index: ElasticIndexes.INDEX_BLOCKS,
                    _id: blockDoc.height,
                },
            }, blockDoc];
            for (const txDoc of txDocs) {
                bulkPayload.push({ index: { _index: ElasticIndexes.INDEX_TRANSACTIONS, _id: txDoc.hash } });
                bulkPayload.push(txDoc);
            }
            await this._elasticService.bulkUpdate({ body: bulkPayload });

            // Dispatch notification on websockets for frontend
            this._queue.add(QueueJobs.NOTIFICATION_SOCKET, {
                channel: NotificationChannels.CHANNEL_BLOCKS,
                event: NotificationEvents.EVENT_NEW_BLOCK,
                data: blockDoc,
            }).finally(() => null);
        } catch (error) {
            this._logger.error(`Failed to ingest block ${job.data.blockHeight}: ${error}`);
            // Throw error to enforce retry strategy
            throw error;
        }
    }
}
