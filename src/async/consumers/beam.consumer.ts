import {Process, Processor} from "@nestjs/bull";
import {Logger} from "@nestjs/common";

import {Job} from "bull";

import {QueueJobs, Queues} from "@app/utils";
import {BeamService, LumNetworkService} from "@app/services";
import {BeamEntity} from "@app/database";

@Processor(Queues.QUEUE_BEAMS)
export class BeamConsumer {
    private readonly _logger: Logger = new Logger(BeamConsumer.name);

    constructor(
        private readonly _beamService: BeamService,
        private readonly _lumNetworkService: LumNetworkService
    ) {
    }

    @Process(QueueJobs.INGEST_BEAM)
    async ingestBeam(job: Job<{ id: string }>) {
        if (await this._beamService.get(job.data.id)) {
            return;
        }

        this._logger.debug(`Ingesting beam ${job.data.id}`);

        const beam = await this._lumNetworkService.client.queryClient.beam.get(job.data.id);
        const entity = new BeamEntity({
            creator_address: beam.creatorAddress,
            id: beam.id,
            status: beam.status as number,
            claim_address: beam.claimAddress,
            funds_withdrawn: beam.fundsWithdrawn,
            claimed: beam.claimed,
            cancel_reason: beam.cancelReason,
            hide_content: beam.hideContent,
            schema: beam.schema,
            claim_expires_at_block: beam.claimExpiresAtBlock,
            closes_at_block: beam.closesAtBlock,
            amount: {
                amount: parseFloat(beam.amount.amount),
                denom: beam.amount.denom
            },
            data: beam.data,
            dispatched_at: beam.createdAt,
            closed_at: beam.closedAt,
        });

        await this._beamService.save(entity);
    }
}
