import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { BeamEventValue, QueueJobs, Queues } from '@app/utils';
import { BeamService, LumNetworkService } from '@app/services';

@Processor(Queues.BEAMS)
export class BeamConsumer {
    private readonly _logger: Logger = new Logger(BeamConsumer.name);

    constructor(private readonly _beamService: BeamService, private readonly _lumNetworkService: LumNetworkService) {}

    @Process(QueueJobs.INGEST)
    async ingestBeam(job: Job<{ value: BeamEventValue; url: string; time: Date }>) {
        this._logger.debug(`Ingesting beam ${job.data.value.id}`);

        // Get beam by passing the id received by the tx dispatch in block consumer
        const beam = await this._lumNetworkService.client.queryClient.beam.get(job.data.value.id);

        // Event that will trace beam history
        const event = {
            time: job.data.time,
            type: job.data.url,
            value: job.data.value,
        };

        // Create or update beam entity
        await this._beamService.createOrUpdateBeamEntity(
            beam.id,
            beam.creatorAddress,
            beam.status,
            beam.claimAddress,
            beam.fundsWithdrawn,
            beam.claimed,
            beam.cancelReason,
            beam.hideContent,
            beam.schema,
            beam.claimExpiresAtBlock,
            beam.closesAtBlock,
            {
                amount: parseFloat(beam.amount.amount),
                denom: beam.amount.denom,
            },
            beam.data,
            beam.createdAt,
            beam.closedAt,
            event,
            new Date(),
        );
    }
}
