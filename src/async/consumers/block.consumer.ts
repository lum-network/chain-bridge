import { Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';

import { Job, Queue } from 'bull';
import dayjs from 'dayjs';
import { LumConstants, LumMessages, LumRegistry, LumUtils } from '@lum-network/sdk-javascript';

import { AssetSymbol, getAddressesRelatedToTransaction, isBeam, NotificationChannels, NotificationEvents, QueueJobs, QueuePriority, Queues } from '@app/utils';

import { BlockService, ChainService, TransactionService, ValidatorService } from '@app/services';
import { BlockEntity, TransactionEntity } from '@app/database';

@Processor(Queues.BLOCKS)
export class BlockConsumer {
    private readonly _logger: Logger = new Logger(BlockConsumer.name);

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _blockQueue: Queue,
        @InjectQueue(Queues.BEAMS) private readonly _beamQueue: Queue,
        @InjectQueue(Queues.MILLIONS_DEPOSITS) private readonly _millionsQueue: Queue,
        @InjectQueue(Queues.NOTIFICATIONS) private readonly _notificationQueue: Queue,
        private readonly _blockService: BlockService,
        private readonly _chainService: ChainService,
        private readonly _transactionService: TransactionService,
        private readonly _validatorService: ValidatorService,
    ) {}

    @Process(QueueJobs.INGEST)
    async ingestBlock(job: Job<{ blockHeight: number; notify?: boolean }>) {
        try {
            // Ignore blocks already in db
            if (await this._blockService.get(job.data.blockHeight)) {
                return;
            }

            // Make sure chain is initialize before trying to ingest
            if (!this._chainService.isChainInitialized(AssetSymbol.LUM)) {
                throw new Error(`Chain ${AssetSymbol.LUM} is not yet initialized. Exiting for retry`);
            }

            this._logger.debug(`Ingesting block ${job.data.blockHeight} (attempt ${job.attemptsMade})`);

            // Get block data
            const block = await this._chainService.getChain(AssetSymbol.LUM).client.getBlock(job.data.blockHeight);

            // Get the operator address
            const proposerAddress = LumUtils.toHex(block.block.header.proposerAddress).toUpperCase();
            const validator = await this._validatorService.getByProposerAddress(proposerAddress);
            if (!validator) {
                throw new Error(`Failed to find validator for ${proposerAddress}, exiting for retry`);
            }

            // Format block data
            const blockDoc: Partial<BlockEntity> = {
                hash: LumUtils.toHex(block.blockId.hash).toUpperCase(),
                height: block.block.header.height,
                time: dayjs(block.block.header.time as Date).toDate(),
                tx_count: block.block.txs.length,
                tx_hashes: block.block.txs.map((tx) => LumUtils.toHex(LumUtils.sha256(tx)).toUpperCase()),
                proposer_address: proposerAddress,
                operator_address: validator.operator_address,
                raw_block: LumUtils.toJSON(block) as string,
            };

            // Fetch and format transactions data
            const getFormattedTx = async (rawTx: Uint8Array): Promise<Partial<TransactionEntity>> => {
                // Acquire raw TX
                const tx = await this._chainService.getChain(AssetSymbol.LUM).client.getTx(LumUtils.sha256(rawTx));

                // Decode TX to human-readable format
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
                        return { denom: coin.denom, amount: parseFloat(coin.amount) };
                    }),
                    addresses: [],
                    gas_wanted: (tx.result as unknown as { gasWanted: number }).gasWanted,
                    gas_used: (tx.result as unknown as { gasUsed: number }).gasUsed,
                    memo: txData.body.memo,
                    messages: txData.body.messages.map((msg) => {
                        return { type_url: msg.typeUrl, value: LumUtils.toJSON(LumRegistry.decode(msg)) };
                    }),
                    message_type: txData.body.messages.length ? txData.body.messages[0].typeUrl : null,
                    messages_count: txData.body.messages.length,
                    raw_logs: logs as any[],
                    raw_events: tx.result.events.map((ev) => LumUtils.toJSON(ev)),
                    raw_tx: LumUtils.toJSON(tx) as string,
                    raw_tx_data: LumUtils.toJSON(txData) as string,
                };

                // Add addresses in case of transaction failure
                if (!res.success) {
                    res.addresses = getAddressesRelatedToTransaction(res);
                }

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
                                const denom = attr.value.substring(amount.toString().length);

                                if (!res.amount) {
                                    res.amount = { amount, denom };
                                }

                                // We get auto claim reward amount with unbond
                                if (ev.type === 'unbond') {
                                    res.auto_claim_reward = res.amount;
                                }

                                // We get relevant amount with particular types
                                if (ev.type === 'delegate' || ev.type === 'unbond' || ev.type === 'withdraw_rewards') {
                                    res.amount = { amount, denom };
                                }
                            }
                        }

                        // Get Millions deposit/withdrawal information
                        // TODO: Add deposit_update when available
                        if (ev.type === 'deposit' || ev.type === 'withdraw_deposit') {
                            const keyArray = ev.attributes.map((a) => a.key);

                            if (keyArray.includes('pool_id') && keyArray.includes('deposit_id') && keyArray.includes('amount') && keyArray.includes('depositor')) {
                                const id = ev.attributes.find((a) => a.key === 'deposit_id').value;

                                // Parse amount
                                const amountValue = ev.attributes.find((a) => a.key === 'amount').value;
                                const amount = parseFloat(amountValue);
                                const denom = amountValue.substring(amount.toString().length);

                                // Dispatch Millions Deposits for ingest
                                await this._millionsQueue.add(
                                    QueueJobs.INGEST,
                                    {
                                        id: id,
                                        value: {
                                            poolId: Number(ev.attributes.find((a) => a.key === 'pool_id')?.value || undefined),
                                            withdrawalId: Number(ev.attributes.find((a) => a.key === 'withdrawal_id')?.value || undefined),
                                            depositorAddress: ev.attributes.find((a) => a.key === 'depositor')?.value || undefined,
                                            winnerAddress: ev.attributes.find((a) => a.key === 'winner')?.value || undefined,
                                            isSponsor: Boolean(ev.attributes.find((a) => a.key === 'is_sponsor')?.value || false),
                                            amount: { amount, denom },
                                        },
                                        height: blockDoc.height,
                                    },
                                    {
                                        jobId: `millions-deposit-${id}-${blockDoc.height}`,
                                        attempts: 5,
                                        backoff: 60000,
                                        priority: QueuePriority.NORMAL,
                                    },
                                );
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

            // Save entities
            await this._blockService.save(blockDoc);
            const transactions = await Promise.all(block.block.txs.map(getFormattedTx));
            await this._transactionService.saveBulk(transactions);

            // Dispatch beams for ingest
            for (const txDoc of transactions) {
                for (const message of txDoc.messages) {
                    if (isBeam(message.type_url)) {
                        await this._beamQueue.add(
                            QueueJobs.INGEST,
                            { id: message.value.id, value: message.value, url: message.type_url, time: txDoc.time },
                            {
                                jobId: `beam-${message.value.id}`,
                                attempts: 5,
                                backoff: 60000,
                                priority: QueuePriority.NORMAL,
                            },
                        );
                    }
                }
            }

            // If it's intended to notify frontend of incoming block
            if (job.data.notify) {
                // Dispatch notification on websockets for frontend
                await this._notificationQueue.add(QueueJobs.NOTIFICATION_SOCKET, {
                    channel: NotificationChannels.BLOCKS,
                    event: NotificationEvents.NEW_BLOCK,
                    data: blockDoc,
                });
            }
        } catch (error) {
            this._logger.error(`Failed to ingest block ${job.data.blockHeight}: ${error}`, error.stack);
            throw error;
        }
    }

    @Process(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD)
    async verifyBlocksBackward(job: Job<{ chainId: string; fromBlock: number; toBlock: number }>) {
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
                    name: QueueJobs.INGEST,
                    data: { blockHeight: i },
                    opts: {
                        jobId: `${job.data.chainId}-block-${i}`,
                        attempts: 5,
                        backoff: 60000,
                        priority: QueuePriority.LOW,
                    },
                });
            }
            await this._blockQueue.addBulk(jobs);
        } else if (missing > 0) {
            const r1 = [job.data.fromBlock, job.data.fromBlock + Math.floor((job.data.toBlock - job.data.fromBlock) / 2)];
            const r2 = [r1[1] + 1, job.data.toBlock];
            this._logger.debug(`Trigger block backward check for ranges [${r1[0]}, ${r1[1]}], [${r2[0]}, ${r2[1]}]`);
            await this._blockQueue.add(
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
            await this._blockQueue.add(
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
