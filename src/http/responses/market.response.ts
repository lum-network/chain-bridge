import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MarketResponse {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty()
    @Expose()
    denom: string;

    @ApiProperty()
    @Expose()
    price: number;

    @ApiProperty()
    @Expose()
    created_at?: Date = null;

    @ApiProperty()
    @Expose()
    updated_at?: Date = null;

    constructor(data: Partial<MarketResponse>) {
        Object.assign(this, data);
    }
}
