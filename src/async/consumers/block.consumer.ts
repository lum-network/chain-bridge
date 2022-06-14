import {Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

import {Job, Queue} from 'bull';
import {InjectQueue, Process, Processor} from '@nestjs/bull';

import moment from 'moment';

import {LumUtils, LumRegistry, LumMessages, LumConstants} from '@lum-network/sdk-javascript';

import {isBeam} from '@app/utils';
import {NotificationChannels, NotificationEvents, QueueJobs, Queues} from '@app/utils/constants';

import {BeamService, BlockService, LumNetworkService, TransactionService, ValidatorService} from '@app/services';
import {BeamEntity, BlockEntity, TransactionEntity} from "@app/database";


@Processor(Queues.QUEUE_DEFAULT)
export class BlockConsumer {
    private readonly _logger: Logger = new Logger(BlockConsumer.name);

    constructor(
        @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue,
        private readonly _beamService: BeamService,
        private readonly _blockService: BlockService,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _transactionService: TransactionService,
        private readonly _validatorService: ValidatorService,
    ) {
    }

    @Process(QueueJobs.INGEST_BLOCK)
    async ingestBlock(job: Job<{ blockHeight: number; notify?: boolean }>) {
        // Only ingest if allowed by the configuration
        if (this._configService.get<boolean>('INGEST_ENABLED') === false) {
            return;
        }

        try {
            // Ignore blocks already in elastic
            if (await this._blockService.get(job.data.blockHeight)) {
                return;
            }

            this._logger.debug(`Ingesting block ${job.data.blockHeight} (attempt ${job.attemptsMade})`);

            // Get block data
            const block = await this._lumNetworkService.client.getBlock(job.data.blockHeight);

            // Get the operator address
            const proposerAddress = LumUtils.toHex(block.block.header.proposerAddress).toUpperCase();
            const validator = await this._validatorService.getByProposerAddress(proposerAddress);
            if(!validator){
                throw new Error(`Failed to find validator for ${proposerAddress}, exiting for retry`);
            }

            // Format block data
            const blockDoc: Partial<BlockEntity> = {
                hash: LumUtils.toHex(block.blockId.hash).toUpperCase(),
                height: block.block.header.height,
                time: moment(block.block.header.time as Date).toDate(),
                tx_count: block.block.txs.length,
                tx_hashes: block.block.txs.map((tx) => LumUtils.toHex(LumUtils.sha256(tx)).toUpperCase()),
                proposer_address: proposerAddress,
                operator_address: validator.operator_address,
                raw_block: LumUtils.toJSON(block) as string,
            };

            // Fetch and format transactions data
            const getFormattedTx = async (rawTx: Uint8Array): Promise<Partial<TransactionEntity>> => {
                // Acquire raw TX
                const tx = await this._lumNetworkService.client.getTx(LumUtils.sha256(rawTx));

                // Decode TX to human readable format
                const txData = LumRegistry.decodeTx(tx.tx);

                // Parse the raw logs
                const logs = LumUtils.parseRawLogs(tx.result.log);

                // Build the transaction document from information
                const res: Partial<TransactionEntity> = {
                    hash: LumUtils.toHex(tx.hash).toUpperCase(),
                    height: tx.height,
                    time: blockDoc.time,
                    proposer_address: blockDoc.proposer_address,
                    operator_address: blockDoc.operator_address,
                    success: tx.result.code === 0,
                    code: tx.result.code,
                    fees: txData.authInfo.fee.amount.map((coin) => {
                        return {denom: coin.denom, amount: parseFloat(coin.amount)};
                    }),
                    addresses: [],
                    gas_wanted: (tx.result as unknown as { gasWanted: number }).gasWanted,
                    gas_used: (tx.result as unknown as { gasUsed: number }).gasUsed,
                    memo: txData.body.memo,
                    messages: txData.body.messages.map((msg) => {
                        return {type_url: msg.typeUrl, value: LumUtils.toJSON(LumRegistry.decode(msg))};
                    }),
                    message_type: txData.body.messages.length ? txData.body.messages[0].typeUrl : null,
                    messages_count: txData.body.messages.length,
                    raw_logs: logs as any[],
                    raw_events: tx.result.events.map((ev) => LumUtils.toJSON(ev)),
                    raw_tx: LumUtils.toJSON(tx) as string,
                    raw_tx_data: LumUtils.toJSON(txData) as string,
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

                                if (!res.amount) {
                                    res.amount = {amount, denom};
                                }

                                // We get auto claim reward amount with unbond
                                if (ev.type === 'unbond') {
                                    res.auto_claim_reward = res.amount;
                                }

                                // We get relevant amount with particular types
                                if (ev.type === 'delegate' || ev.type === 'unbond' || ev.type === 'withdraw_rewards') {
                                    res.amount = {amount, denom};
                                }
                            }
                        }
                    }
                }

                // Multisend case
                if (res.messages.length === 1 && res.messages[0].type_url === LumMessages.MsgMultiSendUrl) {
                    res.amount = {
                        denom: LumConstants.MicroLumDenom,
                        amount: !res.messages[0].value.inputs
                            ? '0'
                            : res.messages[0].value.inputs
                                .map((i: any) => (!i.coins ? 0 : i.coins.map((c: any) => (c.denom === LumConstants.MicroLumDenom ? parseInt(c.amount) : 0)).reduce((a: number, b: number) => a + b)))
                                .reduce((a: number, b: number) => a + b),
                    };
                }

                return res;
            };

            const getFormattedBeam = (value: any): BeamEntity => {
                return {
                    creator_address: value.creatorAddress,
                    id: value.id,
                    status: value.status,
                    claim_address: value.claimAddress,
                    funds_withdrawn: value.fundsWithdrawn,
                    claimed: value.claimed,
                    cancel_reason: value.cancelReason,
                    hide_content: value.hideContent,
                    schema: value.schema,
                    claim_expires_at_block: value.claimExpiresAtBlock,
                    closes_at_block: value.closesAtBlock,
                    amount: value.amount,
                    data: JSON.stringify(value.data),
                };
            };

            // Save entities
            await this._blockService.save(blockDoc);
            const transactions = await Promise.all(block.block.txs.map(getFormattedTx));
            await this._transactionService.saveBulk(transactions);

            const beams: BeamEntity[] = [];
            for (const txDoc of transactions) {
                for (const message of txDoc.messages) {
                    if (isBeam(message.type_url)) {
                        const beamDoc = getFormattedBeam(message.value);
                        beams.push(beamDoc);
                    }
                }
            }
            await this._beamService.saveBulk(beams);

            if (job.data.notify) {
                // Dispatch notification on websockets for frontend
                await this._queue.add(QueueJobs.NOTIFICATION_SOCKET, {
                    channel: NotificationChannels.CHANNEL_BLOCKS,
                    event: NotificationEvents.EVENT_NEW_BLOCK,
                    data: blockDoc,
                });
            }
        } catch (error) {
            this._logger.error(`Failed to ingest block ${job.data.blockHeight}: ${error}`, error.stack);
            // Throw error to enforce retry strategy
            throw error;
        }
    }

    @Process(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD)
    async verifyBlocksBackward(job: Job<{ chainId: string; fromBlock: number; toBlock: number }>) {
        if (this._configService.get<boolean>('INGEST_BACKWARD_ENABLED') === false) {
            this._logger.debug('Backward ingest is disabled');
            return;
        }

        this._logger.debug(`Verifying range from block ${job.data.fromBlock} to block ${job.data.toBlock} for chain with id ${job.data.chainId}`);
        const res = await this._blockService.countInRange(job.data.fromBlock, job.data.toBlock - 1);

        this._logger.debug(`Found ${res}/${job.data.toBlock - job.data.fromBlock} block synced`);
        const missing = job.data.toBlock - job.data.fromBlock - res;
        if (missing > 0 && job.data.toBlock - job.data.fromBlock <= 1000) {
            // 1000 => block range resync if one block missing
            this._logger.debug(`Trigger block sync for all blocks within [${job.data.fromBlock}, ${job.data.toBlock}]`);
            const jobs = [];
            for (let i = job.data.fromBlock; i <= job.data.toBlock; i++) {
                jobs.push({
                    name: QueueJobs.INGEST_BLOCK,
                    data: {blockHeight: i},
                    opts: {
                        jobId: `${job.data.chainId}-block-${i}`,
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
                    jobId: `${job.data.chainId}-check-block-range-${r1[0]}-${r1[1]}`,
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
                    jobId: `${job.data.chainId}-check-block-range-${r2[0]}-${r2[1]}`,
                },
            );
        } else {
            this._logger.debug(`All blocks synced in this range, exiting job.`);
        }
    }
}
