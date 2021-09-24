import { Expose, Exclude, Type } from 'class-transformer';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { BalanceResponse } from '@app/http';

// @Exclude()
export class ProposalResponse {
    @Expose({ name: 'proposalId' })
    proposal_id: any;

    @Expose()
    status: ProposalStatus;

    @Expose({ name: 'totalDeposit' })
    @Type(() => BalanceResponse)
    total_deposit: BalanceResponse[];

    constructor(data: Partial<ProposalResponse>) {
        Object.assign(this, data);
    }
}
