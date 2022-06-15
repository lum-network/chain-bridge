import {ApiProperty} from "@nestjs/swagger";

import {Exclude, Expose} from 'class-transformer';
import {BalanceResponse} from '@app/http/responses/balance.response';

@Exclude()
export class DelegationResponse {
    @ApiProperty()
    @Expose()
    balance: BalanceResponse;

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
