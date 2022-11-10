import { ApiProperty } from '@nestjs/swagger';

export class AssetHistorical {
    @ApiProperty()
    readonly id?: string;

    @ApiProperty()
    readonly extra?: any[];
}
