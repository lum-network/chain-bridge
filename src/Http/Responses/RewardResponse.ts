import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class RewardResponse {
    @Expose()
    denom: string;

    @Expose()
    amount: number;
}
