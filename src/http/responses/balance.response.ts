import {ApiProperty} from "@nestjs/swagger";

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BalanceResponse {
    @ApiProperty()
    @Expose()
    denom: string;

    @ApiProperty()
    @Expose()
    amount: number;
}
