import {Exclude, Expose, Type} from "class-transformer";
import BalanceResponse from "@app/Http/Responses/BalanceResponse";
import RewardResponse from "@app/Http/Responses/RewardResponse";

@Exclude()
export class ValidatorDescriptionResponse {
    @Expose()
    moniker: string;

    @Expose()
    identity: string;

    @Expose()
    website: string;

    @Expose()
    security_contact: string;

    @Expose()
    details: string;

    constructor(data: Partial<ValidatorDescriptionResponse>) {
        Object.assign(this, data);
    }
}

@Exclude()
export class ValidatorDelegationResponse {
    @Expose()
    delegator_address: string;

    @Expose()
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

    @Expose()
    max_rate: number;

    @Expose()
    max_change_rate: number;
}

@Exclude()
export class ValidatorCommissionResponse {
    @Expose()
    @Type(() => ValidatorCommissionRatesResponse)
    commission_rates: ValidatorCommissionRatesResponse;

    @Expose()
    update_time: Date;
}

@Exclude()
export default class ValidatorResponse {
    @Expose()
    operator_address: string;

    @Expose()
    jailed: boolean;

    @Expose()
    status: number;

    @Expose()
    tokens: string;

    @Expose()
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
