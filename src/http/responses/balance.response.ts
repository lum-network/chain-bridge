import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BalanceResponse {
    @Expose()
    denom: string;

    @Expose()
    amount: number;
}
