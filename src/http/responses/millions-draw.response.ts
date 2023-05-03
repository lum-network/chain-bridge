import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { BalanceResponse } from '@app/http';

@Exclude()
export class MillionsDrawResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    draw_id: number;

    @ApiProperty()
    @Expose()
    pool_id: number;

    @ApiProperty()
    @Expose()
    state: number;

    @ApiProperty()
    @Expose()
    error_state: number;

    @ApiProperty()
    @Expose()
    rand_seed: string;

    @ApiProperty()
    @Expose()
    prize_pool_fresh_amount: string;

    @ApiProperty()
    @Expose()
    prize_pool_remains_amount: string;

    @ApiProperty()
    @Expose()
    total_winners: number;

    @ApiProperty()
    @Expose()
    total_winners_amount: string;

    @ApiProperty()
    @Expose()
    created_at_height: number;

    @ApiProperty()
    @Expose()
    updated_at_height: number;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    prize_pool: BalanceResponse;

    @ApiProperty()
    @Expose()
    created_at?: Date = null;

    @ApiProperty()
    @Expose()
    updated_at?: Date = null;
}
