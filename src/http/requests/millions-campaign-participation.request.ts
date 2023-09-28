import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MillionsCampaignParticipationRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    campaign_id: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    wallet_address: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    password: string;
}
