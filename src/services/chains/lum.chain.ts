import { QueryProposalResponse, QueryProposalsResponse } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/query';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import dayjs from 'dayjs';
import { lastValueFrom, map } from 'rxjs';

import { GenericChain } from '@app/services/chains/generic.chain';
import { ApiUrl } from '@app/utils';

export class LumChain extends GenericChain {
    getMarketCap = async (): Promise<number> => {
        const [supply, unit_price_usd] = await Promise.all([this.getTokenSupply(), this.getPrice()]);
        return supply * unit_price_usd.market_data.current_price.usd;
    };

    getPrice = async (): Promise<any> => {
        return lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any[]> => {
        return lastValueFrom(
            this.httpService.get(`${ApiUrl.GET_LUM_PRICE}/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`).pipe(
                map((response) =>
                    response.data.prices.map((price) => {
                        return {
                            key: String(price[0]),
                            value: Number(price[1]),
                        };
                    }),
                ),
            ),
        );
    };

    getTVL = async (): Promise<number> => {
        const [totalAllocatedToken, price] = await Promise.all([this.getTotalAllocatedToken(), this.getPrice()]);
        return totalAllocatedToken * price.market_data.current_price.usd;
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

        const now = dayjs();

        const votingDateTime = getProposals.proposals
            .map((el) => ({
                votingTime: el.votingEndTime,
                proposalId: el.proposalId,
            }))
            .filter((el) => dayjs(el.votingTime).isAfter(now));

        if (!votingDateTime.length) {
            return [];
        }

        const getVotersByOpenProposalId = votingDateTime?.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);

        return getVotersByOpenProposalId;
    };
}
