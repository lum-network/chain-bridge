import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MillionsDepositorResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    amount: number;

    @ApiProperty()
    @Expose()
    rank: number;

    @ApiProperty()
    @Expose()
    address: string;

    @ApiProperty()
    @Expose()
    native_denom: string;

    @ApiProperty()
    @Expose()
    pool_id: number;
}
