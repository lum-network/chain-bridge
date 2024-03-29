import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { BalanceResponse } from '@app/http';

@Exclude()
export class MillionsPrizeResponse {
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
    prize_id: number;

    @ApiProperty()
    @Expose()
    winner_address: string;

    @ApiProperty()
    @Expose()
    created_at_height: number;

    @ApiProperty()
    @Expose()
    updated_at_height: number;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty()
    @Expose()
    usd_token_value: number;

    @ApiProperty()
    @Expose()
    expires_at?: Date = null;

    @ApiProperty()
    @Expose()
    created_at?: Date = null;

    @ApiProperty()
    @Expose()
    updated_at?: Date = null;
}

@Exclude()
export class MillionsPrizeStatsResponse {
    @ApiProperty()
    @Expose()
    biggest_prize_amount: string;

    @ApiProperty()
    @Expose()
    total_pool_prizes: number;

    @ApiProperty()
    @Expose()
    total_prizes_amount: string;
}

@Exclude()
export class MillionsBiggestWinnerResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    draw_id: number;

    @ApiProperty()
    @Expose()
    raw_amount: number;

    @ApiProperty()
    @Expose()
    pool_id: number;

    @ApiProperty()
    @Expose()
    denom_native: string;

    @ApiProperty()
    @Expose()
    sum_of_deposits: number;

    @ApiProperty()
    @Expose()
    apr: number;

    @ApiProperty()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @Expose()
    updated_at: Date;

    @ApiProperty()
    @Expose()
    created_at_height: number;
}
