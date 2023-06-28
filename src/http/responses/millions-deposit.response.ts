import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { BalanceResponse } from '@app/http';

@Exclude()
export class MillionsDepositResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty()
    @Expose()
    pool_id: number;

    @ApiProperty()
    @Expose()
    withdrawal_id: number;

    @ApiProperty()
    @Expose()
    depositor_address: string;

    @ApiProperty()
    @Expose()
    winner_address: string;

    @ApiProperty()
    @Expose()
    is_sponsor: boolean;

    @ApiProperty()
    @Expose()
    block_height: number;
}
