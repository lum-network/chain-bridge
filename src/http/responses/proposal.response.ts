import { ApiProperty } from '@nestjs/swagger';

import { Expose, Exclude, Type } from 'class-transformer';

import Long from 'long';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { BalanceResponse } from '@app/http/responses/balance.response';
import { Coin } from '@lum-network/sdk-javascript/build/codec/cosmos/base/v1beta1/coin';

@Exclude()
export class ResultResponse {
    @ApiProperty()
    @Expose()
    yes: number;

    @ApiProperty()
    @Expose()
    no: number;

    @ApiProperty()
    @Expose()
    abstain: number;

    @ApiProperty()
    @Expose({ name: 'noWithVeto' })
    no_with_veto: number;
}

@Exclude()
class ContentResponse {
    @ApiProperty()
    @Expose()
    title: string;

    @ApiProperty()
    @Expose()
    description: string;
}

@Exclude()
export class ProposalResponse {
    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: Long;

    @ApiProperty()
    @Expose({ name: 'submitTime' })
    submit_time: string;

    @ApiProperty()
    @Expose({ name: 'depositEndTime' })
    deposit_end_time: string;

    @ApiProperty()
    @Expose({ name: 'votingStartTime' })
    voting_start_time: string;

    @ApiProperty()
    @Expose({ name: 'votingEndTime' })
    voting_end_time: string;

    @ApiProperty()
    @Expose()
    status: ProposalStatus;

    @ApiProperty({ type: () => ContentResponse })
    @Expose()
    @Type(() => ContentResponse)
    content: ContentResponse;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose({ name: 'totalDeposit' })
    @Type(() => BalanceResponse)
    total_deposit: BalanceResponse[];

    @ApiProperty({ type: () => ResultResponse })
    @Expose({ name: 'finalTallyResult' })
    @Type(() => ResultResponse)
    final_result: ResultResponse;

    constructor(data: Partial<ProposalResponse>) {
        Object.assign(this, data);
    }
}

export class ProposalVotersResponse {
    @ApiProperty()
    @Expose({ name: 'id' })
    id: string;

    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: string;

    @ApiProperty()
    @Expose({ name: 'voterAddress' })
    voter_address: string;

    @ApiProperty()
    @Expose({ name: 'voterOperatorAddress' })
    voter_operator_address: string;

    @ApiProperty()
    @Expose({ name: 'voteOption' })
    vote_option: number;

    @ApiProperty()
    @Expose({ name: 'voteOption' })
    vote_weight: string;

    @ApiProperty()
    @Expose({ name: 'votedByOperatorAddress' })
    voted_by_operator_address: string;

    constructor(data: Partial<ProposalVotersResponse>) {
        Object.assign(this, data);
    }
}

export class ProposalDepositorsResponse {
    @ApiProperty()
    @Expose({ name: 'id' })
    id: string;

    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: string;

    @ApiProperty()
    @Expose({ name: 'depositorAddress' })
    depositor_address: string;

    @ApiProperty()
    @Expose({ name: 'amount' })
    amount: Coin[];

    constructor(data: Partial<ProposalDepositorsResponse>) {
        Object.assign(this, data);
    }
}
