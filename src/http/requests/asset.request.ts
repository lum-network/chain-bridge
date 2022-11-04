import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class AssetRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    metrics: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    since: string;
}
