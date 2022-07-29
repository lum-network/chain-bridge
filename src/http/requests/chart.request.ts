import {ApiProperty} from "@nestjs/swagger";

import {IsDateString, IsNotEmpty, IsString} from 'class-validator';
import {ChartTypes} from "@app/utils";

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
}
