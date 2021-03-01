import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ElasticIndexes, NotificationChannels, NotificationEvents, QueueJobs, Queues } from '@app/Utils/Constants';
import { BlockchainService, ElasticService } from '@app/Services';
import { config } from '@app/Utils/Config';
import moment from 'moment';

const extractValueFromEvents = async (events: [{ type; attributes: [{ key; value }] }], key: string) => {
    let retn = null;
    for (const ev of events) {
        await ev.attributes.forEach(attr => {
            if (attr.key == key) {
                retn = attr.value;
                return;
            }
        });
    }
    return retn;
};

const extractValueFromMsg = async (msgs: [{ type; value: {} }], key: string) => {
    let retn = null;
    for (const msg of msgs) {
        await Object.keys(msg.value).forEach(v => {
            if (v == key) {
                retn = msg.value[v];
                return;
            }
        });
    }
    return retn;
};

@Processor(Queues.QUEUE_DEFAULT)
export default class TransactionConsumer {
    private readonly _logger: Logger = new Logger(TransactionConsumer.name);

    constructor(@InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue, private readonly _elasticService: ElasticService) {}

    @Process(QueueJobs.INGEST_TRANSACTION)
    async ingestTransaction(job: Job<{ transaction_hash: string }>) {
        // Only ingest if allowed by the configuration
        if (config.isTransactionsIngestionEnabled() === false) {
            return;
        }

        // Acquire the transaction information from the blockchain
        const tx = await BlockchainService.getInstance()
            .getClient()
            .getTransactionLive(job.data.transaction_hash);
        if (!tx) {
            this._logger.error(`Failed to acquire the transaction data from blockchain for hash ${job.data.transaction_hash}`);
            return;
        }

        // Compute events from blockchain
        let events: [{ type; attributes: [{ key; value }] }];
        if (tx && tx.logs) {
            if (tx.logs[0] !== undefined) {
                events = tx.logs[0].events;
            }
        }

        // Extract interesting values from events
        const action = (await extractValueFromEvents(events, 'action')) || 'unknown';
        let senderAddress = (await extractValueFromEvents(events, 'sender')) || (await extractValueFromMsg(tx.tx.value.msg, 'from_address'));

        // We try again to get sender with particular types
        if (senderAddress === null) {
            if (action === 'edit_validator') {
                senderAddress = await extractValueFromMsg(tx.tx.value.msg, 'address');
            } else if (action == 'delegate' || action === 'begin_unbonding') {
                senderAddress = await extractValueFromMsg(tx.tx.value.msg, 'delegator_address');
            }
        }
        let recipientAddress = (await extractValueFromEvents(events, 'recipient')) || (await extractValueFromMsg(tx.tx.value.msg, 'to_address'));

        // We try to get recipient with particular types
        if (recipientAddress === null) {
            if (action === 'delegate' || action === 'begin_unbonding') {
                recipientAddress = await extractValueFromMsg(tx.tx.value.msg, 'validator_address');
            }
        }
        const amount = await extractValueFromEvents(events, 'amount');

        // We construct the object payload
        const payload = {
            height: parseInt(tx.height),
            hash: tx.txhash,
            action,
            amount,
            success: tx && tx.logs && tx.logs.length && tx.logs.length > 0,
            log: tx.logs[0].log || null,
            gas_wanted: parseInt(tx.gas_wanted),
            gas_used: parseInt(tx.gas_used),
            from_address: senderAddress,
            to_address: recipientAddress,
            name: tx.tx.value.memo,
            dispatched_at: moment(tx.timestamp).format('yyyy-MM-DD HH:mm:ss'),
            msgs: JSON.stringify(tx.tx.value.msg),
            raw: JSON.stringify(tx),
        };

        // Ingest or update (allow to relaunch the ingest from scratch to ensure we store the correct data)
        if ((await this._elasticService.documentExists(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash)) === false) {
            await this._elasticService.documentCreate(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash, payload);
            this._logger.log(`Transaction ${payload.hash} ingested`);

            // Dispatch notification on websockets for frontend
            this._queue
                .add(QueueJobs.NOTIFICATION_SOCKET, {
                    channel: NotificationChannels.CHANNEL_TRANSACTIONS,
                    event: NotificationEvents.EVENT_NEW_TRANSACTION,
                    data: payload,
                })
                .finally(() => null);
        } else {
            await this._elasticService.documentUpdate(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash, payload);
            this._logger.log(`Transaction ${payload.hash} updated`);
        }
    }
}
