import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LumResponse {
    @ApiProperty()
    @Expose()
    price: number;

    @ApiProperty()
    @Expose()
    denom: string;

    @ApiProperty()
    @Expose()
    symbol: string;

    @ApiProperty()
    @Expose()
    liquidity: number;

    @ApiProperty()
    @Expose()
    volume_24h: number;

    @ApiProperty()
    @Expose()
    name: number;

    @ApiProperty()
    @Expose()
    previous_day_price: number;

    constructor(data: Partial<LumResponse>) {
        Object.assign(this, data);
    }
}
