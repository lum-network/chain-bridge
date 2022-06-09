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
    @Expose({name: 'securityContact'})
    security_contact: string;

    @ApiProperty()
    @Expose()
    details: string;
}

@Exclude()
class ValidatorDelegationDetailsResponse {
    @ApiProperty()
    @Expose({name: 'delegatorAddress'})
    delegator_address: string;

    @ApiProperty()
    @Expose({name: 'validatorAddress'})
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
    rate: number;

    @ApiProperty()
    @Expose({name: 'maxRate'})
    max_rate: number;

    @ApiProperty()
    @Expose({name: 'maxChangeRate'})
    max_change_rate: number;
}

@Exclude()
export class ValidatorCommissionResponse {
    @ApiProperty({type: () => ValidatorCommissionRatesResponse})
    @Expose({name: 'commissionRates'})
    @Type(() => ValidatorCommissionRatesResponse)
    commission_rates: ValidatorCommissionRatesResponse;

    @ApiProperty()
    @Expose({name: 'updateTime'})
    update_time: Date;
}

@Exclude()
export class ValidatorResponse {
    @ApiProperty()
    @Expose({name: 'operatorAddress'})
    operator_address: string;

    @ApiProperty()
    @Expose()
    address: string;

    @ApiProperty()
    @Expose()
    genesis: boolean;

    @ApiProperty()
    @Expose({name: 'selfBonded'})
    self_bonded: number;

    @ApiProperty()
    @Expose()
    jailed: boolean;

    @ApiProperty()
    @Expose()
    status: number;

    @ApiProperty()
    @Expose()
    tokens: string;

    @ApiProperty()
    @Expose({name: 'delegatorShares'})
    delegator_shares: string;

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

    @ApiProperty({type: () => [BalanceResponse]})
    @Expose()
    @Type(() => BalanceResponse)
    rewards: BalanceResponse[];

    @ApiProperty({type: () => [BlockResponse]})
    @Expose()
    @Type(() => BlockResponse)
    blocks: BlockResponse[];

    constructor(data: Partial<ValidatorResponse>) {
        Object.assign(this, data);
    }
}
