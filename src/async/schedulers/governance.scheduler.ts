import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { LumNetworkService } from '@app/services';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

@Injectable()
export class GovernanceScheduler {
    private _logger: Logger = new Logger(GovernanceScheduler.name);

    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async voteSync() {
        try {
            this._logger.log(`Syncing proposals from chain...`);
            // We want to get the proposals in order to fetch the id
            // The id will be used to access who voted on the proposal and the related deposited amount
            const resultsProposals = await this._lumNetworkService.client.queryClient.gov.proposals(
                ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED |
                    ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD |
                    ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD |
                    ProposalStatus.PROPOSAL_STATUS_PASSED |
                    ProposalStatus.PROPOSAL_STATUS_REJECTED |
                    ProposalStatus.PROPOSAL_STATUS_FAILED |
                    ProposalStatus.UNRECOGNIZED,
                '',
                '',
            );

            // We iterate throught the proposals to store the Ids
            const getProposalId = resultsProposals.proposals.map((proposal) => proposal.proposalId).map((proposalIdValue) => proposalIdValue.low);

            // We get the votes of the proposal
            for (const id of getProposalId) {
                const getVotesById = await this._lumNetworkService.client.queryClient.gov.votes(id);
                // Todo: save in DB
                this._logger.log(`Found getVotesById`, getVotesById);

                // Todo: Index

                // If we have pagination key, we just patch it and it will process in the next loop
            }
        } catch (error) {
            this._logger.error(`Failed to fetch proposals from chain`, error);
        }
    }
}
