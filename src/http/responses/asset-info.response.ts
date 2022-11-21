import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class AssetInfo {
    @ApiProperty()
    @Expose()
    last_updated_at?: Date;

    @ApiProperty()
    @Expose()
    unit_price_usd?: number;

    @ApiProperty()
    @Expose()
    total_value_usd?: number;

    @ApiProperty()
    @Expose()
    supply?: number;

    @ApiProperty()
    @Expose()
    apy?: number;

    @ApiProperty()
    @Expose()
    total_allocated_token?: number;
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
