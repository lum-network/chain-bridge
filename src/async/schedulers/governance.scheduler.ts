import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ProposalVoteService, ProposalDepositService, LumNetworkService } from '@app/services';

@Injectable()
export class GovernanceScheduler {
    private _logger: Logger = new Logger(GovernanceScheduler.name);

    constructor(
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _governanceProposalVoteService: ProposalVoteService,
        private readonly _governanceProposalDepositService: ProposalDepositService,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async voteSync() {
        if (!this._configService.get<boolean>('GOVERNANCE_SYNC_ENABLED')) {
            return;
        }
        try {
            this._logger.log(`Syncing votes from chain...`);

            // We need to get the proposalsId in order to fetch the voters
            const proposalIds = await this._lumNetworkService.getOpenVotingProposals();

            if (!proposalIds || !proposalIds.length) {
                this._logger.log(`voteSync scheduler not launched as no current open proposals to vote on...`);
                return;
            }

            // Only start the patch process if there are actual proposalId
            for (const id of proposalIds) {
                // Fetch the votes based on the proposalId
                const getVotes = await this._lumNetworkService.client.queryClient.gov.votes(id);

                // Map the votes to get the voters, the voteOption and the voteWeight
                const getVoterAndOptions = getVotes.votes.map((voteArgs) => ({
                    voter: voteArgs.voter,
                    voteOption: voteArgs.options[0].option,
                    voteWeight: voteArgs.options[0].weight,
                }));

                // Create or update to DB if we have new voters based on the proposalId
                for (const voteKey of getVoterAndOptions) {
                    // Only update the db if there is any vote during the voting period
                    if (getVotes && getVotes.votes && getVotes.votes.length > 0) {
                        await this._governanceProposalVoteService.createOrUpdateVoters(id, voteKey.voter, voteKey.voteOption, voteKey.voteWeight);
                    }
                }
            }
            this._logger.log(`Synced ${proposalIds.length || 0} proposals from chain...`);
        } catch (error) {
            this._logger.error(`Failed to sync votes from chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async depositSync() {
        if (!this._configService.get<boolean>('GOVERNANCE_SYNC_ENABLED')) {
            return;
        }
        try {
            this._logger.log(`Syncing deposits from chain...`);

            // We need to get the proposalsId in order to fetch the deposits
            const proposalIds = await this._lumNetworkService.getOpenVotingProposals();

            if (!proposalIds || !proposalIds.length) {
                this._logger.log(`No active proposals to sync deposits for...`);
                return;
            }

            // Only start the patch process if there are actual proposalId
            for (const id of proposalIds) {
                // Fetch the deposits based on the proposalId
                const getDeposits = await this._lumNetworkService.client.queryClient.gov.deposits(id);

                // Map the deposits to get the depositors and the amount
                const getDepositor = getDeposits.deposits.map((deposit) => ({
                    depositor: deposit.depositor,
                    amount: deposit.amount[0],
                }));

                // Create or update to DB if we have new depositors based on the proposalId
                for (const depositorAddress of getDepositor) {
                    await this._governanceProposalDepositService.createOrUpdateDepositors(id, depositorAddress.depositor, depositorAddress.amount);
                }
            }
            this._logger.log(`Synced ${proposalIds.length || 0} proposals from chain...`);
        } catch (error) {
            this._logger.error(`Failed to sync deposits from chain...`, error);
        }
    }
}
