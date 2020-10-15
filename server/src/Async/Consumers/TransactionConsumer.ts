import {Process, Processor} from "@nestjs/bull";
import {ElasticIndexes, QueueJobs, Queues} from "@app/Utils/Constants";
import {Job} from "bull";
import {BlockchainService, ElasticService} from "@app/Services";
import {Logger} from "@nestjs/common";

const extractValueFromEvents = async (events: [{ type, attributes: [{ key, value }] }], key: string) => {
    let retn = null;
    for (let ev of events) {
        await ev.attributes.forEach(attr => {
            if (attr.key == key) {
                retn = attr.value;
                return;
            }
        })
    }
    return retn;
}

const extractValueFromMsg = async (msgs: [{ type, value: {} }], key: string) => {
    let retn = null;
    for (let msg of msgs) {
        await Object.keys(msg.value).forEach(v => {
            if (v == key) {
                retn = msg.value[v];
                return;
            }
        })
    }
    return retn;
}

@Processor(Queues.QUEUE_DEFAULT)
export default class TransactionConsumer {
    private readonly _logger: Logger = new Logger(TransactionConsumer.name);

    @Process(QueueJobs.INGEST_TRANSACTION)
    async ingestTransaction(job: Job<{ transaction_hash: string }>) {
        // Acquire the transaction information from the blockchain
        const tx = await BlockchainService.getInstance().getClient().getTransactionLive(job.data.transaction_hash);
        if (!tx) {
            this._logger.error(`Failed to acquire the transaction data from blockchain for hash ${job.data.transaction_hash}`);
            return;
        }

        // Compute events from blockchain
        let events: [{ type, attributes: [{ key, value }] }];
        if (tx && tx.logs) {
            if (tx.logs[0] !== undefined) {
                events = tx.logs[0].events;
            }
        }

        // Extract interesting values from events
        const action = await extractValueFromEvents(events, "action") || 'unknown';
        let senderAddress = await extractValueFromEvents(events, "sender") || await extractValueFromMsg(tx.tx.value.msg, 'from_address');

        // We try again to get sender with particular types
        if (senderAddress === null) {
            if (action === "edit_validator") {
                senderAddress = await extractValueFromMsg(tx.tx.value.msg, "address");
            } else if (action == "delegate" || action === "begin_unbonding") {
                senderAddress = await extractValueFromMsg(tx.tx.value.msg, "delegator_address");
            }
        }
        let recipientAddress = await extractValueFromEvents(events, "recipient") || await extractValueFromMsg(tx.tx.value.msg, 'to_address');

        // We try to get recipient with particular types
        if (recipientAddress === null) {
            if (action === "delegate" || action === "begin_unbonding") {
                recipientAddress = await extractValueFromMsg(tx.tx.value.msg, "validator_address");
            }
        }
        const amount = await extractValueFromEvents(events, "amount");

        // We construct the object payload
        const payload = {
            height: parseInt(tx.height),
            hash: tx.txhash,
            action,
            amount,
            success: (tx && tx.logs && tx.logs.length && tx.logs.length > 0),
            log: tx.logs[0].log || null,
            gas_wanted: parseInt(tx.gas_wanted),
            gas_used: parseInt(tx.gas_used),
            from_address: senderAddress,
            to_address: recipientAddress,
            name: tx.tx.value.memo,
            dispatched_at: tx.timestamp,
            msgs: JSON.stringify(tx.tx.value.msg),
            raw: JSON.stringify(tx)
        };

        // Ingest or update (allow to relaunch the ingest from scratch to ensure we store the correct data)
        if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash)) === false) {
            await ElasticService.getInstance().documentCreate(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash, payload);
            this._logger.log(`Transaction ${payload.hash} ingested`);
        } else {
            await ElasticService.getInstance().documentUpdate(ElasticIndexes.INDEX_TRANSACTIONS, payload.hash, payload);
            this._logger.log(`Transaction ${payload.hash} updated`);
        }
    }
}
