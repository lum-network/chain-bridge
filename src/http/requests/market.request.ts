import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsNotEmpty } from 'class-validator';

export class MarketRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    since: Date;
}
