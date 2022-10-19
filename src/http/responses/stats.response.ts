import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StatsResponse {
    @ApiProperty()
    @Expose()
    inflation: string;

    @ApiProperty()
    @Expose({ name: 'chainId' })
    chain_id: string;

    @ApiProperty()
    @Expose({ name: 'totalSupply' })
    total_supply: string;

    constructor(data: Partial<StatsResponse>) {
        Object.assign(this, data);
    }
}
