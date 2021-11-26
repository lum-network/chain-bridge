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
class RedelegationEntry {
    @Expose({ name: 'completionTime' })
    completion_time: string;
}

@Exclude()
class RedelegationEntries {
    @Expose()
    balance: string;

    @Expose({ name: 'redelegationEntry' })
    @Type(() => RedelegationEntry)
    redelegation_entry: RedelegationEntry;
}

@Exclude()
class RedelegationDetails {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorSrcAddress' })
    validator_src_address: string;

    @Expose({ name: 'validatorDstAddress' })
    validator_dst_address: string;
}

@Exclude()
class RedelegationResponse {
    @Expose()
    @Type(() => RedelegationDetails)
    redelegation: RedelegationDetails;

    @Expose()
    @Type(() => RedelegationEntries)
    entries: RedelegationEntries[];
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
    @Type(() => RedelegationResponse)
    redelegations: RedelegationResponse[] = [];

    @Expose()
    @Type(() => BalanceResponse)
    commissions: BalanceResponse[] = [];

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
