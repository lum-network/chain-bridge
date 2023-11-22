import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MillionsCampaignMemberResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    campaign_id: string;

    @ApiProperty()
    @Expose()
    wallet_address: string;

    @ApiProperty()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @Expose()
    updated_at: Date;
}
