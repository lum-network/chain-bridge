import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { MillionsDepositEntity } from '@app/database';
import { MillionsDepositService } from '@app/services';
import { QueueJobs, Queues } from '@app/utils';

@Processor(Queues.MILLIONS_DEPOSITS)
export class MillionsDepositConsumer {
    private readonly _logger: Logger = new Logger(MillionsDepositConsumer.name);

    constructor(private readonly _millionsDepositService: MillionsDepositService) {}

    @Process(QueueJobs.INGEST)
    async ingestMillionsDeposit(job: Job<{ id: string; value: any; height: number }>) {
        // If no id we exit
        if (!job.data.id) {
            this._logger.error('Failed to ingest Millions deposit as no job id was found');
            return;
        }

        this._logger.debug(`Ingesting Millions deposit ${job.data.id}`);

        const deposit = await this._millionsDepositService.getById(job.data.id);

        const formattedMillionsDeposit: MillionsDepositEntity = {
            id: job.data.id,
            amount: job.data.value.amount,
            pool_id: job.data.value.poolId,
            deposit_id: job.data.value.depositId,
            withdrawal_id: job.data.value.withdrawalId,
            depositor_address: job.data.value.depositorAddress,
            winner_address: job.data.value.winnerAddress,
            is_sponsor: job.data.value.isSponsor,
            block_height: job.data.height,
        };

        // If no deposit in db we create it, else we update it
        if (!deposit) {
            await this._millionsDepositService.save(formattedMillionsDeposit);

            this._logger.debug(`Millions deposit ${job.data.id} created`);
            return;
        }

        // If deposit in db but block height is higher we exit
        if (deposit.block_height > formattedMillionsDeposit.block_height) {
            this._logger.debug(`Millions deposit ${job.data.id} already ingested`);
            return;
        }

        try {
            await this._millionsDepositService.update(formattedMillionsDeposit);
        } catch (e) {
            this._logger.error(e);
            return;
        }

        this._logger.debug(`Millions deposit ${job.data.id} updated`);
    }
}
