import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { MarketData } from '@app/database';

export class MarketResponse {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty()
    @Expose()
    market_data: MarketData[];

    @ApiProperty()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @Expose()
    updated_at?: Date;
}
