import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ChartGroupType, ChartTypes } from '@app/utils/constants';

export class ChartRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    start_at: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    end_at: Date;

    @ApiProperty({
        enum: ChartTypes,
    })
    @IsNotEmpty()
    @IsString()
    type: ChartTypes;

    @ApiProperty({
        enum: ChartGroupType,
    })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @IsIn(Object.values(ChartGroupType))
    group_type?: ChartGroupType;
}
