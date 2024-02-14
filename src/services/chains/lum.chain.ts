import { QueryProposalResponse, QueryProposalsResponse } from '@lum-network/sdk-javascript/build/codegen/cosmos/gov/v1/query';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codegen/cosmos/gov/v1/gov';

import dayjs from 'dayjs';
import { lastValueFrom, map } from 'rxjs';

import { GenericChain } from '@app/services/chains/generic.chain';
import { ApiUrl } from '@app/utils';

export class LumChain extends GenericChain {
    getMarketCap = async (): Promise<number> => {
        const [supply, price] = await Promise.all([this.getTokenSupply(), this.getPrice()]);
        return supply * price;
    };

    getPrice = async (): Promise<number> => {
        try {
            const data = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
            return Number(data.market_data.current_price.usd);
        } catch (e) {
            return 0;
        }
    };

    getPriceEUR = async (): Promise<number> => {
        try {
            const data = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
            return Number(data.market_data.current_price.eur);
        } catch (e) {
            return 0;
        }
    };

    getCommunityData = async (): Promise<{ twitter_followers: number }> => {
        try {
            const data = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
            return data.community_data;
        } catch (e) {
            return { twitter_followers: 0 };
        }
    };

    getTotalVolume = async (): Promise<number> => {
        try {
            const data = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
            return Number(data.market_data.total_volume.usd);
        } catch (e) {
            return 0;
        }
    };

    getPriceChange = async (): Promise<string> => {
        try {
            const data = await lastValueFrom(this.httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
            return data.market_data.price_change_24h;
        } catch (e) {
            return null;
        }
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

    getProposals = async (): Promise<QueryProposalsResponse> => {
        // We want to sync all proposals and get the proposal_id
        return await this.client.cosmos.gov.v1.proposals({
            depositor: '',
            voter: '',
            proposalStatus:
                ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED |
                ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD |
                ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD |
                ProposalStatus.PROPOSAL_STATUS_PASSED |
                ProposalStatus.PROPOSAL_STATUS_REJECTED |
                ProposalStatus.PROPOSAL_STATUS_FAILED |
                ProposalStatus.UNRECOGNIZED,
        });
    };

    getProposal = async (proposalId: number): Promise<QueryProposalResponse> => {
        return this.client.cosmos.gov.v1.proposal({ proposalId: BigInt(proposalId) });
    };

    getOpenVotingProposals = async (): Promise<any> => {
        const getProposals = await this.getProposals();

        const now = dayjs();

        const votingDateTime = getProposals.proposals
            .map((el) => ({
                votingTime: el.votingEndTime,
                proposalId: el.id,
            }))
            .filter((el) => dayjs(el.votingTime).isAfter(now));

        if (!votingDateTime.length) {
            return [];
        }

        return votingDateTime?.map((proposal) => proposal.proposalId).map((bigInt) => bigInt);
    };
}
