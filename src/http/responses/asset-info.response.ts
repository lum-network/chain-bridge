import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class AssetInfo {
    @ApiProperty()
    @Expose()
    last_updated_at: Date;

    @ApiProperty()
    @Expose()
    key: 'unit_price_usd' | 'total_value_usd' | 'supply' | 'apy' | 'total_allocated_token' | 'account_balance' | 'tvl';

    @ApiProperty()
    @Expose()
    value: number;
}

export class AssetInfoResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty({ type: () => AssetInfo })
    @Expose()
    @Type(() => AssetInfo)
    value: AssetInfo;

    @ApiProperty({ type: () => AssetInfo })
    @Exclude()
    @Type(() => AssetInfo)
    extra: AssetInfo[];

    constructor(data: Partial<AssetInfoResponse>) {
        Object.assign(this, data);
    }
}
