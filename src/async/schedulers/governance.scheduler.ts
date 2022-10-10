import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { GovernanceProposalsVotesService, LumNetworkService } from '@app/services';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

@Injectable()
export class GovernanceScheduler {
    private _logger: Logger = new Logger(GovernanceScheduler.name);

    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _governanceProposalsVotesService: GovernanceProposalsVotesService) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async proposalsIdSync(): Promise<number[]> {
        try {
            this._logger.log(`Syncing proposals from chain...`);

            // We want to sync all proposals and get the proposal_id
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

            // Map the results proposal to get the low int from Long
            const getProposalId = resultsProposals?.proposals.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);

            this._logger.log(`Found ${getProposalId.length} proposalId - ${getProposalId}`);

            // return the getProposalId
            return getProposalId;
        } catch (error) {
            this._logger.error(`Failed to sync proposals from chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async voteSync() {
        try {
            this._logger.log(`Syncing votes from chain...`);

            // We need to get the proposalsId in order to fetch the voters
            const getVotersByProposalId = await this.proposalsIdSync();

            // Verify if any new proposalId where minted on chain

            for (const id of getVotersByProposalId) {
                let page: Uint8Array | undefined = undefined;

                // Fetch the votes based on the proposalId
                const getVotes = await this._lumNetworkService.client.queryClient.gov.votes(id);
                // Map the votes to get the voters
                const getVoter = getVotes.votes.map((voterHash) => voterHash.voter);
                this._logger.log(`Found ${getVoter.length} - voters`);

                // Create or update the DB if we have new voters based on the proposalId
                for (const voter of getVoter) {
                    this._governanceProposalsVotesService.createOrUpdate(voter, id);
                    this._logger.log(`Voter - ${voter} - got updated`);
                }

                // If we get a pagination key, we just patch it and it will process in the next loop
                if (getVotes.pagination && getVotes.pagination.nextKey && getVotes.pagination.nextKey.length) {
                    page = getVotes.pagination.nextKey;
                    this._logger.log(`Found Page - ${page}`);
                }
            }
        } catch (error) {
            this._logger.error(`Failed to sync votes from chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async depositSync() {
        try {
            this._logger.log(`Syncing deposits from chain...`);

            // We need to get the proposalsId in order to fetch the deposits
            const getDepositsByProposalId = await this.proposalsIdSync();

            for (const id of getDepositsByProposalId) {
                // Fetch the deposits based on the proposalId
                const getDeposits = await this._lumNetworkService.client.queryClient.gov.deposits(id);

                // Map the deposits to get the depositors
                const getDepositor = getDeposits.deposits.map((depositorHash) => depositorHash.depositor);

                this._logger.log(`Found ${getDepositor.length} - Depositors - ${getDepositor}`);
            }
        } catch (error) {
            this._logger.error(`Failed to sync deposits from chain...`, error);
        }
    }
}
