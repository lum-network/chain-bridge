import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';

@Exclude()
export default class RewardResponse {
    @Expose()
    @Type(() => BalanceResponse)
    total: BalanceResponse[];
}
