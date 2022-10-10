import { Proposal, ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { LumRegistry } from '@lum-network/sdk-javascript';
import { LumNetworkService } from '@app/services';
import { Logger } from '@nestjs/common';

export const decodeContent = (proposal: Proposal): Proposal => {
    const newProposal = proposal;

    newProposal.content = LumRegistry.decode(proposal.content);

    return newProposal;
};

export class ProposalsSync {
    private _logger: Logger = new Logger(ProposalsSync.name);
    constructor(private readonly _lumNetworkService: LumNetworkService) {}
    async getProposals() {
        try {
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

            this._logger.error(`Sync proposals from chain...`);

            return resultsProposals;
        } catch (error) {
            this._logger.error(`Failed to sync proposals from chain...`, error);
        }
    }

    async getProposalsId() {
        try {
            const getProposalId = await new ProposalsSync(this._lumNetworkService).getProposals();
            const getVotersByProposalId = getProposalId?.proposals.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);
            this._logger.error(`Sync getVotersByProposalId...`);
            return getVotersByProposalId;
        } catch (error) {
            this._logger.error(`Failed to sync proposalsById...`, error);
        }
    }
}
