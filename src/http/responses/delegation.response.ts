import {ApiProperty} from "@nestjs/swagger";

import { Exclude, Expose, Type } from 'class-transformer';
import { BalanceResponse } from '@app/http/responses/balance.response';

@Exclude()
class SubDelegationResponse {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @ApiProperty()
    @Expose()
    shares: string;
}

@Exclude()
export class DelegationResponse {
    @ApiProperty()
    @Expose()
    balance: BalanceResponse;

    @ApiProperty({type: () => SubDelegationResponse})
    @Expose()
    @Type(() => SubDelegationResponse)
    delegation: SubDelegationResponse;
}
