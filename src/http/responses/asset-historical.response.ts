import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { AssetInfo } from './asset-info.response';

@Exclude()
export class AssetHistoricalResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    extra: AssetInfo[];
}
