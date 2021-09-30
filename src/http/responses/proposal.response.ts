import { Expose, Exclude, Type } from 'class-transformer';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { BalanceResponse } from '@app/http';

@Exclude()
class ResultResponse {
    @Expose()
    yes: number;

    @Expose()
    no: number;

    @Expose()
    abstain: number;

    @Expose({ name: 'noWithVeto' })
    no_with_veto: number;
}

@Exclude()
export class ProposalResponse {
    @Expose({ name: 'proposalId' })
    proposal_id: any;

    @Expose({ name: 'submitTime' })
    submit_time: string;

    @Expose({ name: 'depositEndTime' })
    deposit_end_time: string;

    @Expose({ name: 'votingStartTime' })
    voting_start_time: string;

    @Expose({ name: 'votingEndTime' })
    voting_end_time: string;

    @Expose()
    status: ProposalStatus;

    @Expose({ name: 'totalDeposit' })
    @Type(() => BalanceResponse)
    total_deposit: BalanceResponse[];

    @Expose({ name: 'finalTallyResult' })
    @Type(() => ResultResponse)
    result: ResultResponse;

    constructor(data: Partial<ProposalResponse>) {
        Object.assign(this, data);
    }
}
