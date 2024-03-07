import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { BalanceResponse } from '@app/http/responses/balance.response';
import { MillionsCampaignMemberResponse } from '@app/http/responses/millions-campaign-member.response';

@Exclude()
export class MillionsCampaignResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    description: string;

    @ApiProperty()
    @Expose()
    pool_id: string;

    @ApiProperty()
    @Expose()
    username: string;

    @ApiProperty()
    @Expose()
    image: string;

    @ApiProperty()
    @Expose()
    drops: number;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty({ type: () => MillionsCampaignMemberResponse })
    @Expose()
    @Type(() => MillionsCampaignMemberResponse)
    members: MillionsCampaignMemberResponse[];

    @ApiProperty()
    @Expose()
    start_at: Date;

    @ApiProperty()
    @Expose()
    end_at: Date;

    @ApiProperty()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @Expose()
    updated_at: Date;
}
