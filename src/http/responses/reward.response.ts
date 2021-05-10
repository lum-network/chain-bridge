import { Exclude, Expose, Type } from 'class-transformer';
import { BalanceResponse } from '@app/http/responses/balance.response';

@Exclude()
class RewardResponse {
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose()
    @Type(() => BalanceResponse)
    reward: BalanceResponse[];
}

@Exclude()
export class AllRewardResponse {
    @Expose()
    @Type(() => BalanceResponse)
    total: BalanceResponse[];

    @Expose()
    @Type(() => RewardResponse)
    rewards: RewardResponse[];
}
