import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';

@Exclude()
export default class AccountResponse {
    @Expose()
    address: string;

    @Expose()
    @Type(() => BalanceResponse)
    coins: BalanceResponse[];

    @Expose()
    public_key: string;

    @Expose()
    account_number: number;

    @Expose()
    sequence: number;

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
