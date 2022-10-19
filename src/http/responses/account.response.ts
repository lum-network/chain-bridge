import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

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

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    total_coins: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    unlocked_coins: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    locked_coins: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    locked_delegated_coins: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
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

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose({ name: 'initialClaimableAmount' })
    @Type(() => BalanceResponse)
    initial_claimable_amount: BalanceResponse[];
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
    @ApiProperty({ type: () => BalanceResponse })
    @Type(() => BalanceResponse)
    balance: BalanceResponse;

    @ApiProperty()
    @Expose({ name: 'pubKey' })
    public_key: string;

    @ApiProperty()
    @Expose({ name: 'accountNumber' })
    account_number: number;

    @ApiProperty({ type: () => DelegationResponse })
    @Expose()
    @Type(() => DelegationResponse)
    delegations: DelegationResponse[];

    @ApiProperty({ type: () => AllRewardResponse })
    @Expose()
    @Type(() => AllRewardResponse)
    all_rewards: AllRewardResponse;

    @ApiProperty({ type: () => [TransactionResponse] })
    @Expose()
    @Type(() => TransactionResponse)
    transactions: TransactionResponse[] = [];

    @ApiProperty()
    @Expose()
    sequence: number;

    @ApiProperty()
    @Expose()
    total_shares: number;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    @Type(() => BalanceResponse)
    commissions: BalanceResponse[] = [];

    @ApiProperty({ type: () => VestingResponse })
    @Expose()
    @Type(() => VestingResponse)
    vesting: VestingResponse;

    @ApiProperty({ type: () => AirdropResponse })
    @Expose()
    @Type(() => AirdropResponse)
    airdrop: AirdropResponse;

    constructor(data: Partial<AccountResponse>) {
        Object.assign(this, data);
    }
}
