import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';
import RewardResponse from '@app/Http/Responses/RewardResponse';

@Exclude()
export class ValidatorDescriptionResponse {
    @Expose()
    moniker: string;

    @Expose()
    identity: string;

    @Expose()
    website: string;

    @Expose({name: 'securityContact'})
    security_contact: string;

    @Expose()
    details: string;

    constructor(data: Partial<ValidatorDescriptionResponse>) {
        Object.assign(this, data);
    }
}

@Exclude()
export class ValidatorDelegationResponse {
    @Expose({name: 'delegatorAddress'})
    delegator_address: string;

    @Expose({name: 'validatorAddress'})
    validator_address: string;

    @Expose()
    shares: string;

    @Expose()
    @Type(() => BalanceResponse)
    balance: BalanceResponse;
}

@Exclude()
export class ValidatorCommissionRatesResponse {
    @Expose()
    rate: number;

    @Expose({name: 'maxRate'})
    max_rate: number;

    @Expose({name: 'maxChangeRate'})
    max_change_rate: number;
}

@Exclude()
export class ValidatorCommissionResponse {
    @Expose({name: 'commissionRates'})
    @Type(() => ValidatorCommissionRatesResponse)
    commission_rates: ValidatorCommissionRatesResponse;

    @Expose({name: 'updateTime'})
    update_time: Date;
}

@Exclude()
export default class ValidatorResponse {
    @Expose({name: 'operatorAddress'})
    operator_address: string;

    @Expose()
    jailed: boolean;

    @Expose()
    status: number;

    @Expose()
    tokens: string;

    @Expose({name: 'delegatorShares'})
    delegator_shares: string;

    @Expose()
    @Type(() => ValidatorDescriptionResponse)
    description: ValidatorDescriptionResponse;

    @Expose()
    @Type(() => ValidatorDelegationResponse)
    delegations: ValidatorDelegationResponse[];

    @Expose()
    @Type(() => RewardResponse)
    rewards: RewardResponse[];

    @Expose()
    @Type(() => ValidatorCommissionResponse)
    commission: ValidatorCommissionResponse;

    constructor(data: Partial<ValidatorResponse>) {
        Object.assign(this, data);
    }
}
