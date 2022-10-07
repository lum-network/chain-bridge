import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';
import { BalanceResponse } from '@app/http/responses/balance.response';

@Exclude()
class RewardResponse {
    @ApiProperty()
    @Expose()
    validator_address: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    @Type(() => BalanceResponse)
    reward: BalanceResponse[];
}

@Exclude()
export class AllRewardResponse {
    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    @Type(() => BalanceResponse)
    total: BalanceResponse[];

    @ApiProperty({ type: () => [RewardResponse] })
    @Expose()
    @Type(() => RewardResponse)
    rewards: RewardResponse[];
}
