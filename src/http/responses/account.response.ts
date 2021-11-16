import { Exclude, Expose, Type } from 'class-transformer';
import { AllRewardResponse, BalanceResponse, DelegationResponse, TransactionResponse } from '@app/http';
import Long from 'long';

@Exclude()
class UnbondingEntriesResponse {
    @Expose()
    balance: string;

    @Expose({ name: 'completionTime' })
    completion_time: string;

    @Expose({ name: 'creationHeight' })
    height: Long;
}

@Exclude()
class UnbondingResponse {
    @Expose()
    @Type(() => UnbondingEntriesResponse)
    entries: UnbondingEntriesResponse[] = [];

    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}

@Exclude()
export class AccountResponse {
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
    @Type(() => AllRewardResponse)
    all_rewards: AllRewardResponse;

    @Expose()
    @Type(() => TransactionResponse)
    transactions: TransactionResponse[] = [];

    @Expose()
    sequence: number;

    @Expose()
    @Type(() => UnbondingResponse)
    unbondings: UnbondingResponse[] = [];

    @Expose()
    @Type(() => BalanceResponse)
    commissions: BalanceResponse[] = [];

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
