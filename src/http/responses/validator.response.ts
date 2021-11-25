import { Exclude, Expose, Type } from 'class-transformer';
import { BalanceResponse } from '@app/http/responses/balance.response';
import { BlockResponse } from '@app/http/responses/block.response';

@Exclude()
export class ValidatorDescriptionResponse {
    @Expose()
    moniker: string;

    @Expose()
    identity: string;

    @Expose()
    website: string;

    @Expose({ name: 'securityContact' })
    security_contact: string;

    @Expose()
    details: string;

    constructor(data: Partial<ValidatorDescriptionResponse>) {
        Object.assign(this, data);
    }
}

@Exclude()
class ValidatorDelegationDetailsResponse {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose()
    shares: string;
}

@Exclude()
export class ValidatorDelegationResponse {
    @Expose()
    @Type(() => ValidatorDelegationDetailsResponse)
    delegation: ValidatorDelegationDetailsResponse;

    @Expose()
    @Type(() => BalanceResponse)
    balance: BalanceResponse;
}

@Exclude()
export class ValidatorCommissionRatesResponse {
    @Expose()
    rate: number;

    @Expose({ name: 'maxRate' })
    max_rate: number;

    @Expose({ name: 'maxChangeRate' })
    max_change_rate: number;
}

@Exclude()
export class ValidatorCommissionResponse {
    @Expose({ name: 'commissionRates' })
    @Type(() => ValidatorCommissionRatesResponse)
    commission_rates: ValidatorCommissionRatesResponse;

    @Expose({ name: 'updateTime' })
    update_time: Date;
}

@Exclude()
export class ValidatorResponse {
    @Expose({ name: 'operatorAddress' })
    operator_address: string;

    @Expose()
    address: string;

    @Expose()
    genesis: boolean;

    @Expose({ name: 'selfBonded' })
    self_bonded: number;

    @Expose()
    jailed: boolean;

    @Expose()
    status: number;

    @Expose()
    tokens: string;

    @Expose({ name: 'delegatorShares' })
    delegator_shares: string;

    @Expose()
    @Type(() => ValidatorDescriptionResponse)
    description: ValidatorDescriptionResponse;

    @Expose()
    @Type(() => ValidatorDelegationResponse)
    delegations: ValidatorDelegationResponse[];

    @Expose({ name: 'delegationsNextKey' })
    delegations_next_key: string;

    @Expose()
    @Type(() => BalanceResponse)
    rewards: BalanceResponse[];

    @Expose()
    @Type(() => ValidatorCommissionResponse)
    commission: ValidatorCommissionResponse;

    @Expose()
    @Type(() => BlockResponse)
    blocks: BlockResponse[];

    constructor(data: Partial<ValidatorResponse>) {
        Object.assign(this, data);
    }
}
