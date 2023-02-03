import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LumRegistry } from '@lum-network/sdk-javascript';

import { ChainService, ProposalDepositService, ProposalService, ProposalVoteService } from '@app/services';
import { LumChain } from '@app/services/chains';
import { AssetSymbol } from '@app/utils';

@Injectable()
export class GovernanceScheduler {
    private _logger: Logger = new Logger(GovernanceScheduler.name);

    constructor(
        private readonly _configService: ConfigService,
        private readonly _chainService: ChainService,
        private readonly _governanceProposalService: ProposalService,
        private readonly _governanceProposalVoteService: ProposalVoteService,
        private readonly _governanceProposalDepositService: ProposalDepositService,
    ) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async proposalSync() {
        if (!this._configService.get<boolean>('GOVERNANCE_SYNC_ENABLED')) {
            return;
        }
        this._logger.log(`[RootSync] Syncing proposals from chain...`);

        const proposals = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).getProposals();
        for (const proposal of proposals.proposals) {
            let decodedContent = null;
            let typeUrl = null;

            // Try to decode the content using messages array
            if (proposal.messages.length > 0) {
                const decodedMsg = LumRegistry.decode(proposal.messages[0]);

                // Acquire the typeUrl
                typeUrl = proposal.messages[0].typeUrl.split('/')[1];
                // If it's an old system, we have to take the inner typeUrl
                if (typeUrl === 'cosmos.gov.v1.MsgExecLegacyContent') {
                    typeUrl = decodedMsg.content.typeUrl.split('/')[1];
                }

                // Acquire the content
                if (decodedMsg.content) {
                    decodedContent = LumRegistry.decode(decodedMsg.content);

                    // If the decoded content is a MsgSubmitProposal it contains plan, we need to patch the height value to store raw int
                    if (decodedContent.plan !== undefined && decodedContent.plan !== null) {
                        decodedContent.plan.height = decodedContent.plan.height.toNumber();
                    }
                }
            }

            // If we have no content yet, but we do have an IPFS metadata, acquire the content from there
            if (!decodedContent && proposal.metadata && proposal.metadata.startsWith('ipfs://')) {
                const ipfsHash = proposal.metadata.replace('ipfs://', '');
                const ipfsContent = await this._chainService.getIPFSContent(ipfsHash);
                if (!ipfsContent) {
                    throw new Error('Failed to acquire proposal content from IPFS gateway');
                }

                decodedContent = {
                    title: ipfsContent.title ? ipfsContent.title : '',
                    description: ipfsContent.details ? ipfsContent.details : '',
                };
            }

            // Create or update the entity
            await this._governanceProposalService.createOrUpdateProposal({
                id: proposal.id.toNumber(),
                type_url: typeUrl,
                status: proposal.status,
                metadata: proposal.metadata,
                content: decodedContent,
                final_tally_result: proposal.finalTallyResult
                    ? {
                          yes: Number(proposal.finalTallyResult.yesCount),
                          abstain: Number(proposal.finalTallyResult.abstainCount),
                          no: Number(proposal.finalTallyResult.noCount),
                          no_with_veto: Number(proposal.finalTallyResult.noWithVetoCount),
                      }
                    : {
                          yes: 0,
                          abstain: 0,
                          no: 0,
                          no_with_veto: 0,
                      },
                total_deposits: proposal.totalDeposit.map((el) => ({ amount: Number(el.amount), denom: el.denom })),
                submitted_at: proposal.submitTime,
                deposit_end_time: proposal.depositEndTime,
                voting_start_time: proposal.votingStartTime,
                voting_end_time: proposal.votingEndTime,
            });
            this._logger.debug(`[RootSync] Synced proposal #${proposal.id.toNumber()}`);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async voteSync() {
        if (!this._configService.get<boolean>('GOVERNANCE_SYNC_ENABLED')) {
            return;
        }
        this._logger.log(`[VoteSync] Syncing votes from chain...`);

        // We need to get the proposalsId in order to fetch the voters
        const proposalIds = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).getOpenVotingProposals();

        if (!proposalIds || !proposalIds.length) {
            this._logger.log(`[VoteSync] No current open proposal to vote on...`);
            return;
        }

        // Only start the patch process if there are actual proposalId
        for (const id of proposalIds) {
            // Fetch the votes based on the proposalId
            const getVotes = await this._chainService.getChain(AssetSymbol.LUM).client.queryClient.gov.votes(id);

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
        this._logger.log(`[VoteSync] Synced ${proposalIds.length || 0} proposals from chain...`);
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async depositSync() {
        if (!this._configService.get<boolean>('GOVERNANCE_SYNC_ENABLED')) {
            return;
        }
        this._logger.log(`[DepositSync] Syncing deposits from chain...`);

        // We need to get the proposalsId in order to fetch the deposits
        const proposalIds = await this._chainService.getChain<LumChain>(AssetSymbol.LUM).getOpenVotingProposals();

        if (!proposalIds || !proposalIds.length) {
            this._logger.log(`[DepositSync] No active proposals to sync deposits for...`);
            return;
        }

        // Only start the patch process if there are actual proposalId
        for (const id of proposalIds) {
            // Fetch the deposits based on the proposalId
            const getDeposits = await this._chainService.getChain(AssetSymbol.LUM).client.queryClient.gov.deposits(id);

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
        this._logger.log(`[DepositSync] Synced ${proposalIds.length || 0} proposals from chain...`);
    }
}
