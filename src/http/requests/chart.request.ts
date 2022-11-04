import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ChartGroupType, ChartTypes } from '@app/utils';

export class ChartRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    start_at: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    end_at: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    type: ChartTypes;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    group_type: ChartGroupType;
}
