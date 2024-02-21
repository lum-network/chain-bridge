import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { MillionsDepositEntity } from '@app/database';
import { ChainService, MillionsDepositService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol, QueueJobs, Queues } from '@app/utils';

@Processor(Queues.MILLIONS)
export class MillionsConsumer {
    private readonly _logger: Logger = new Logger(MillionsConsumer.name);

    constructor(
        private readonly _chainService: ChainService,
        private readonly _millionsDepositService: MillionsDepositService,
    ) {}

    @Process(QueueJobs.INGEST)
    async ingestMillionsDeposit(job: Job<{ depositId: number; poolId: number; height: number; withdrawalId?: number }>) {
        this._logger.debug(`Ingesting Millions deposit ${job.data.depositId}`);

        if (!job.data.depositId || !job.data.poolId || !job.data.height) {
            throw new Error(`invalid_job_data: ${JSON.stringify(job.data)}`);
        }

        // Grab the live deposit from chain
        let liveDeposit = null;
        try {
            liveDeposit = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).client.lum.network.millions.poolDeposit({
                depositId: BigInt(job.data.depositId),
                poolId: BigInt(job.data.poolId),
            });
        } catch (e) {
            await job.log(`Deposit does not exist on the chain: ${e.message}`);
        }

        let deposit = await this._millionsDepositService.getById(job.data.depositId);
        if (!deposit && liveDeposit) {
            deposit = new MillionsDepositEntity({
                id: job.data.depositId,
                pool_id: job.data.poolId,
                block_height: job.data.height,
                amount: {
                    amount: Number(liveDeposit.deposit.amount.amount),
                    denom: liveDeposit.deposit.amount.denom,
                },
                winner_address: liveDeposit.deposit.winnerAddress,
                depositor_address: liveDeposit.deposit.depositorAddress,
                is_sponsor: liveDeposit.deposit.isSponsor,
                withdrawal_id: job.data.withdrawalId || 0,
            });
        } else if (deposit && liveDeposit) {
            if (deposit.block_height > job.data.height) {
                this._logger.debug(`Millions deposit ${job.data.depositId} already ingested`);
                return;
            }
            if (deposit.is_sponsor !== liveDeposit.deposit.isSponsor) {
                deposit.is_sponsor = liveDeposit.deposit.isSponsor;
            }
            if (deposit.winner_address !== liveDeposit.deposit.winnerAddress) {
                deposit.winner_address = liveDeposit.deposit.winnerAddress;
            }
            if (deposit.depositor_address !== liveDeposit.deposit.depositorAddress) {
                deposit.depositor_address = liveDeposit.deposit.depositorAddress;
            }
            if (job.data.withdrawalId && deposit.withdrawal_id !== job.data.withdrawalId) {
                deposit.withdrawal_id = job.data.withdrawalId;
            }
        } else {
            throw new Error(`failed_to_process_deposit: cannot determine the case`);
        }

        await this._millionsDepositService.save(deposit);
        await job.log(`Millions deposit ${job.data.depositId} ingested`);
    }
}
