import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { AssetSymbol, BeamEventValue, QueueJobs, Queues } from '@app/utils';
import { BeamService, ChainService } from '@app/services';

@Processor(Queues.BEAMS)
export class BeamConsumer {
    private readonly _logger: Logger = new Logger(BeamConsumer.name);

    constructor(private readonly _beamService: BeamService, private readonly _chainService: ChainService) {}

    @Process(QueueJobs.INGEST)
    async ingestBeam(job: Job<{ id: string; value: BeamEventValue; url: string; time: Date }>) {
        // If no id we exit
        if (!job.data.id) {
            this._logger.error('Failed to ingest beam as no job id was found');
            return;
        }

        this._logger.debug(`Ingesting beam ${job.data.id}`);

        // Get beam by passing the id received by the tx dispatch in block consumer
        const remoteBeam = await this._chainService.getChain(AssetSymbol.LUM).client.queryClient.beam.get(job.data.id);

        // We format the remote beam to match it against our schema
        const formattedBeam = {
            creator_address: remoteBeam.creatorAddress,
            id: remoteBeam.id,
            status: remoteBeam.status as number,
            claim_address: remoteBeam.claimAddress,
            funds_withdrawn: remoteBeam.fundsWithdrawn,
            claimed: remoteBeam.claimed,
            cancel_reason: remoteBeam.cancelReason,
            hide_content: remoteBeam.hideContent,
            schema: remoteBeam.schema,
            claim_expires_at_block: remoteBeam.claimExpiresAtBlock,
            closes_at_block: remoteBeam.closesAtBlock,
            amount: {
                amount: parseFloat(remoteBeam.amount.amount),
                denom: remoteBeam.amount.denom,
            },
            data: remoteBeam.data,
            dispatched_at: remoteBeam.createdAt,
            closed_at: remoteBeam.closedAt,
        };

        // Event that will trace beam history
        // Make sure it defaults if not present
        const event = {
            time: job.data.time || new Date(),
            type: job.data.url || '',
            value: job.data.value || { id: job.data.id },
        };

        // Check beam in db
        const beam = await this._beamService.get(job.data.id);

        if (!beam) {
            // Save beam
            await this._beamService.createBeam(formattedBeam, event);

            this._logger.debug(`Persisted beam ${job.data.id}`);
        } else {
            // Update beam
            await this._beamService.updateBeam(formattedBeam);

            this._logger.debug(`Updated beam ${job.data.id}`);

            // Update event
            await this._beamService.updateBeamEvent(event);

            this._logger.debug(`Updated beam event ${job.data.url}`);
        }
    }
}
