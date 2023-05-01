import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BalanceResponse } from '@app/http';

@Exclude()
export class MillionsPrizeResponse {
    @ApiProperty()
    @Expose()
    id: number;

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
    expires_at?: Date = null;

    @ApiProperty()
    @Expose()
    created_at?: Date = null;

    @ApiProperty()
    @Expose()
    updated_at?: Date = null;
}
