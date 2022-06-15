import {ApiProperty} from "@nestjs/swagger";

import { Exclude, Expose, Type } from 'class-transformer';
import Long from 'long';

import { AllRewardResponse, BalanceResponse, DelegationResponse, TransactionResponse } from '@app/http';

@Exclude()
class VestingResponse {
    @ApiProperty()
    @Expose({ name: 'startsAt' })
    starts_at: string;

    @ApiProperty()
    @Expose({ name: 'endsAt' })
    ends_at: string;

    @ApiProperty()
    @Expose()
    time: string;

    @ApiProperty()
    @Expose({ name: 'unlockedPercentage' })
    unlocked_percentage: number;

    @ApiProperty()
    @Expose({ name: 'lockedPercentage' })
    locked_percentage: number;

    @ApiProperty({type: () => BalanceResponse})
    @Expose({ name: 'totalCoins' })
    @Type(() => BalanceResponse)
    total_coins: BalanceResponse;

    @ApiProperty({type: () => BalanceResponse})
    @Expose({ name: 'unlockedCoins' })
    @Type(() => BalanceResponse)
    unlocked_coins: BalanceResponse;

    @ApiProperty({type: () => BalanceResponse})
    @Expose({ name: 'lockedCoins' })
    @Type(() => BalanceResponse)
    locked_coins: BalanceResponse;

    @ApiProperty({type: () => BalanceResponse})
    @Expose({ name: 'lockedDelegatedCoins' })
    @Type(() => BalanceResponse)
    locked_delegated_coins: BalanceResponse;

    @ApiProperty({type: () => BalanceResponse})
    @Expose({ name: 'lockedBankCoins' })
    @Type(() => BalanceResponse)
    locked_bank_coins: BalanceResponse;
}

@Exclude()
class AirdropResponse {
    @ApiProperty()
    @Expose()
    address: string;

    @ApiProperty()
    @Expose({ name: 'actionCompleted' })
    action_completed: boolean[];

    @ApiProperty({type: () => [BalanceResponse]})
    @Expose({ name: 'initialClaimableAmount' })
    @Type(() => BalanceResponse)
    initial_claimable_amount: BalanceResponse[];
}

@Exclude()
class UnbondingEntriesResponse {
    @ApiProperty()
    @Expose()
    balance: string;

    @ApiProperty()
    @Expose({ name: 'completionTime' })
    completion_time: string;

    @ApiProperty()
    @Expose({ name: 'creationHeight' })
    height: Long;
}

@Exclude()
class UnbondingResponse {
    @ApiProperty({type: () => [UnbondingEntriesResponse]})
    @Expose()
    @Type(() => UnbondingEntriesResponse)
    entries: UnbondingEntriesResponse[] = [];

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}

@Exclude()
class RedelegationEntry {
    @ApiProperty()
    @Expose({ name: 'completionTime' })
    completion_time: string;
}

@Exclude()
class RedelegationEntries {
    @ApiProperty()
    @Expose()
    balance: string;

    @ApiProperty({type: () => RedelegationEntry})
    @Expose({ name: 'redelegationEntry' })
    @Type(() => RedelegationEntry)
    redelegation_entry: RedelegationEntry;
}

@Exclude()
class RedelegationDetails {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorSrcAddress' })
    validator_src_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorDstAddress' })
    validator_dst_address: string;
}

@Exclude()
class RedelegationResponse {
    @ApiProperty({type: () => RedelegationDetails})
    @Expose()
    @Type(() => RedelegationDetails)
    redelegation: RedelegationDetails;

    @ApiProperty({type: () => [RedelegationEntries]})
    @Expose()
    @Type(() => RedelegationEntries)
    entries: RedelegationEntries[];
}

@Exclude()
export class AccountResponse {
    @ApiProperty({})
    @Expose()
    address: string;

    @ApiProperty()
    @Expose()
    withdraw_address: string;

    @ApiProperty()
    @Expose()
    @ApiProperty({type: () => BalanceResponse})
    @Type(() => BalanceResponse)
    balance: BalanceResponse;

    @ApiProperty()
    @Expose({ name: 'pubKey' })
    public_key: string;

    @ApiProperty()
    @Expose({ name: 'accountNumber' })
    account_number: number;

    @ApiProperty({type: () => DelegationResponse})
    @Expose()
    @Type(() => DelegationResponse)
    delegations: DelegationResponse[];

    @ApiProperty({type: () => AllRewardResponse})
    @Expose()
    @Type(() => AllRewardResponse)
    all_rewards: AllRewardResponse;

    @ApiProperty({type: () => [TransactionResponse]})
    @Expose()
    @Type(() => TransactionResponse)
    transactions: TransactionResponse[] = [];

    @ApiProperty()
    @ApiProperty()
    @Expose()
    sequence: number;

    @ApiProperty({type: () => UnbondingResponse})
    @Expose()
    @Type(() => UnbondingResponse)
    unbondings: UnbondingResponse[] = [];

    @ApiProperty({type: () => [RedelegationResponse]})
    @Expose()
    @Type(() => RedelegationResponse)
    redelegations: RedelegationResponse[] = [];

    @ApiProperty({type: () => [BalanceResponse]})
    @Expose()
    @Type(() => BalanceResponse)
    commissions: BalanceResponse[] = [];

    @ApiProperty({type: () => VestingResponse})
    @Expose()
    @Type(() => VestingResponse)
    vesting: VestingResponse;

    @ApiProperty({type: () => AirdropResponse})
    @Expose()
    @Type(() => AirdropResponse)
    airdrop: AirdropResponse;

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
