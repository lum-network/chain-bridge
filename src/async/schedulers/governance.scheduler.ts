import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { ProposalsVotesService, ProposalsDepositsService, LumNetworkService } from '@app/services';
import { ProposalsSync } from '@app/utils';

@Injectable()
export class GovernanceScheduler {
    private _logger: Logger = new Logger(GovernanceScheduler.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _governanceProposalsVotesService: ProposalsVotesService,
        private readonly _governanceProposalsDepositsService: ProposalsDepositsService,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async voteSync() {
        try {
            this._logger.log(`Syncing votes from chain...`);

            // We need to get the proposalsId in order to fetch the voters
            const getProposalId = await new ProposalsSync(this._lumNetworkService).getProposalsId();

            // Verify if any new proposalId where minted on chain

            for (const id of getProposalId) {
                let page: Uint8Array | undefined = undefined;

                // Fetch the votes based on the proposalId
                const getVotes = await this._lumNetworkService.client.queryClient.gov.votes(id);

                // Map the votes to get the voters and the voter's vote
                const getVoterAndOptions = getVotes.votes.map((voteArgs) => ({
                    voter: voteArgs.voter,
                    voteOption: voteArgs.options[0].option,
                    voteWeight: voteArgs.options[0].weight,
                }));

                // Create or update to DB if we have new voters based on the proposalId
                for (const voteKey of getVoterAndOptions) {
                    this._governanceProposalsVotesService.createOrUpdateVoters(id, voteKey.voter, voteKey.voteOption, voteKey.voteWeight);
                    this._logger.log(`proposals_votes table got updated`);
                }

                // If we get a pagination key, we just patch it and it will process in the next loop
                if (getVotes.pagination && getVotes.pagination.nextKey && getVotes.pagination.nextKey.length) {
                    page = getVotes.pagination.nextKey;
                    this._logger.log(`Found Voters Page - ${page}`);
                }
            }
        } catch (error) {
            this._logger.error(`Failed to sync votes from chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async depositSync() {
        try {
            this._logger.log(`Syncing deposits from chain...`);

            // We need to get the proposalsId in order to fetch the deposits
            const getProposalId = await new ProposalsSync(this._lumNetworkService).getProposalsId();

            for (const id of getProposalId) {
                let page: Uint8Array | undefined = undefined;
                // Fetch the deposits based on the proposalId
                const getDeposits = await this._lumNetworkService.client.queryClient.gov.deposits(id);

                // Map the deposits to get the depositors
                const getDepositor = getDeposits.deposits.map((deposit) => ({
                    depositor: deposit.depositor,
                    amount: deposit.amount[0],
                }));

                // Create or update to DB if we have new depositors based on the proposalId
                for (const depositorAddress of getDepositor) {
                    this._governanceProposalsDepositsService.createOrUpdateDepositors(id, depositorAddress.depositor, depositorAddress.amount);
                    this._logger.log(`proposals_deposits table got updated`);
                }

                // If we get a pagination key, we just patch it and it will process in the next loop
                if (getDeposits.pagination && getDeposits.pagination.nextKey && getDeposits.pagination.nextKey.length) {
                    page = getDeposits.pagination.nextKey;
                    this._logger.log(`Found Depositors Page - ${page}`);
                }
            }
        } catch (error) {
            this._logger.error(`Failed to sync deposits from chain...`, error);
        }
    }
}
