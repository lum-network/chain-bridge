import { QueryProposalResponse, QueryProposalsResponse } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/query';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import moment from 'moment/moment';

import { GenericChain } from '@app/services/chains/generic.chain';
import { ApiUrl } from '@app/utils';

export class LumChain extends GenericChain {
    getMarketCap = async (): Promise<number> => {
        const [supply, unit_price_usd] = await Promise.all([this.getTokenSupply(), this.getPrice()]);
        return supply * unit_price_usd.market_data.current_price.usd;
    };

    getPrice = async (): Promise<any> => {
        const response = await fetch(ApiUrl.GET_LUM_PRICE);
        const data = await response.json();
        return data.data;
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any[]> => {
        const response = await fetch(`${ApiUrl.GET_LUM_PRICE}/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`);
        const data = await response.json();
        return data.prices.map((price) => {
            return {
                key: String(price[0]),
                value: Number(price[1]),
            };
        });
    };

    getProposals = async (): Promise<QueryProposalsResponse> => {
        // We want to sync all proposals and get the proposal_id
        const resultsProposals = await this.client.queryClient.gov.proposals(
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

        return resultsProposals;
    };

    getProposal = async (proposalId: number): Promise<QueryProposalResponse> => {
        return this.client.queryClient.gov.proposal(proposalId);
    };

    getOpenVotingProposals = async (): Promise<any> => {
        const getProposals = await this.getProposals();

        const now = moment();

        const votingDateTime = getProposals.proposals
            .map((el) => ({
                votingTime: el.votingEndTime,
                proposalId: el.proposalId,
            }))
            .filter((el) => moment(el.votingTime) > now);

        if (!votingDateTime.length) {
            return [];
        }

        const getVotersByOpenProposalId = votingDateTime?.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);

        return getVotersByOpenProposalId;
    };
}
