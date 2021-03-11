import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';

@Exclude()
class SubDelegationResponse {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose()
    shares: string;
}

@Exclude()
export default class DelegationResponse {
    @Expose()
    balance: BalanceResponse;

    @Expose()
    @Type(() => SubDelegationResponse)
    delegation: SubDelegationResponse;
}
