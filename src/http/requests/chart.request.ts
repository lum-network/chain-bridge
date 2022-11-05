import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator';
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
    @IsIn([ChartGroupType.GROUP_MONTHLY, ChartGroupType.GROUP_DAILY])
    group_type: ChartGroupType;
}
