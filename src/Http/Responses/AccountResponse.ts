import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';
import DelegationResponse from '@app/Http/Responses/DelegationResponse';
import RewardResponse from '@app/Http/Responses/RewardResponse';
import TransactionResponse from '@app/Http/Responses/TransactionResponse';

@Exclude()
export default class AccountResponse {
    @Expose()
    address: string;

    @Expose()
    withdraw_address: string;

    @Expose()
    @Type(() => BalanceResponse)
    balance: BalanceResponse;

    @Expose({ name: 'pubKey' })
    public_key: string;

    @Expose({ name: 'accountNumber' })
    account_number: number;

    @Expose()
    @Type(() => DelegationResponse)
    delegations: DelegationResponse[];

    @Expose()
    @Type(() => RewardResponse)
    all_rewards: RewardResponse;

    @Expose()
    @Type(() => TransactionResponse)
    transactions: TransactionResponse[] = [];

    @Expose()
    sequence: number;

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
