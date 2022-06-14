import {ApiProperty} from "@nestjs/swagger";

import {Exclude, Expose, Type} from 'class-transformer';

import {BalanceResponse} from '@app/http/responses/balance.response';
import {BlockResponse} from '@app/http/responses/block.response';

@Exclude()
export class ValidatorDescriptionResponse {
    @ApiProperty()
    @Expose()
    moniker: string;

    @ApiProperty()
    @Expose()
    identity: string;

    @ApiProperty()
    @Expose()
    website: string;

    @ApiProperty()
    @Expose()
    security_contact: string;

    @ApiProperty()
    @Expose()
    details: string;
}

@Exclude()
class ValidatorDelegationDetailsResponse {
    @ApiProperty()
    @Expose()
    delegator_address: string;

    @ApiProperty()
    @Expose()
    validator_address: string;

    @ApiProperty()
    @Expose()
    shares: string;
}

@Exclude()
export class ValidatorDelegationResponse {
    @ApiProperty({type: () => ValidatorDelegationDetailsResponse})
    @Expose()
    @Type(() => ValidatorDelegationDetailsResponse)
    delegation: ValidatorDelegationDetailsResponse;

    @ApiProperty({type: () => BalanceResponse})
    @Expose()
    @Type(() => BalanceResponse)
    balance: BalanceResponse;
}

@Exclude()
export class ValidatorCommissionRatesResponse {
    @ApiProperty()
    @Expose()
    current_rate: number;

    @ApiProperty()
    @Expose()
    max_rate: number;

    @ApiProperty()
    @Expose()
    max_change_rate: number;
}

@Exclude()
export class ValidatorCommissionResponse {
    @ApiProperty({type: () => ValidatorCommissionRatesResponse})
    @Expose()
    @Type(() => ValidatorCommissionRatesResponse)
    rates: ValidatorCommissionRatesResponse;

    @ApiProperty()
    @Expose()
    last_updated_at: Date;
}

@Exclude()
export class ValidatorResponse {
    @ApiProperty()
    @Expose()
    operator_address: string;

    @ApiProperty()
    @Expose()
    account_address: string;

    @ApiProperty()
    @Expose()
    address: string;

    @ApiProperty()
    @Expose()
    genesis: boolean;

    @ApiProperty()
    @Expose()
    self_bonded: number;

    @ApiProperty()
    @Expose()
    jailed: boolean;

    @ApiProperty()
    @Expose()
    status: number;

    @ApiProperty()
    @Expose()
    tokens: number;

    @ApiProperty()
    @Expose()
    delegator_shares: string;

    @ApiProperty()
    @Expose()
    displayed_name: string;

    @ApiProperty({type: () => ValidatorDescriptionResponse})
    @Expose()
    @Type(() => ValidatorDescriptionResponse)
    description: ValidatorDescriptionResponse;

    @ApiProperty({type: () => ValidatorCommissionResponse})
    @Expose()
    @Type(() => ValidatorCommissionResponse)
    commission: ValidatorCommissionResponse;

    @ApiProperty({type: () => [ValidatorDelegationResponse]})
    @Expose()
    @Type(() => ValidatorDelegationResponse)
    delegations: ValidatorDelegationResponse[];

    @ApiProperty()
    @Expose({name: 'delegationsNextKey'})
    delegations_next_key: string;

    constructor(data: Partial<ValidatorResponse>) {
        Object.assign(this, data);
    }
}
