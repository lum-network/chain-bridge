import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BalanceResponse } from '@app/http';

@Exclude()
class MillionsPrizeBatchResponse {
    @ApiProperty()
    @Expose()
    pool_percent: number;

    @ApiProperty()
    @Expose()
    quantity: number;

    @ApiProperty()
    @Expose()
    draw_probability: string;
}

@Exclude()
class MillionsPrizeStrategyResponse {
    @ApiProperty({ type: () => [MillionsPrizeBatchResponse] })
    @Expose()
    @Type(() => MillionsPrizeBatchResponse)
    prize_batches: MillionsPrizeBatchResponse[];
}

@Exclude()
class MillionsDrawDeltaResponse {
    @ApiProperty()
    @Expose()
    seconds: number;

    @ApiProperty()
    @Expose()
    nanos: number;
}

@Exclude()
class MillionsDrawScheduleResponse {
    @ApiProperty()
    @Expose()
    initial_draw_at: string;

    @ApiProperty({ type: () => MillionsDrawDeltaResponse })
    @Expose()
    @Type(() => MillionsDrawDeltaResponse)
    draw_delta: MillionsDrawDeltaResponse;
}

@Exclude()
class MillionsValidatorResponse {
    @ApiProperty()
    @Expose()
    operator_address: string;

    @ApiProperty()
    @Expose()
    is_enabled: boolean;

    @ApiProperty()
    @Expose()
    bonded_amount: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    @Type(() => BalanceResponse)
    rewards_amount: BalanceResponse[];
}

@Exclude()
export class MillionsPoolResponse {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty()
    @Expose()
    denom: string;

    @ApiProperty()
    @Expose()
    denom_native: string;

    @ApiProperty()
    @Expose()
    chain_id: string;

    @ApiProperty()
    @Expose()
    connection_id: string;

    @ApiProperty()
    @Expose()
    transfer_channel_id: string;

    @ApiProperty()
    @Expose()
    controller_port_id: string;

    @ApiProperty()
    @Expose()
    bech32_prefix_acc_address: string;

    @ApiProperty()
    @Expose()
    bech32_prefix_val_address: string;

    @ApiProperty()
    @Expose()
    min_deposit_amount: string;

    @ApiProperty()
    @Expose()
    module_account_address: string;

    @ApiProperty()
    @Expose()
    ica_account_address: string;

    @ApiProperty()
    @Expose()
    next_draw_id: number;

    @ApiProperty()
    @Expose()
    tvl_amount: string;

    @ApiProperty()
    @Expose()
    depositors_count: number;

    @ApiProperty()
    @Expose()
    last_draw_state: number;

    @ApiProperty()
    @Expose()
    state: number;

    @ApiProperty()
    @Expose()
    created_at_height: number;

    @ApiProperty()
    @Expose()
    updated_at_height: number;

    @ApiProperty({ type: () => [MillionsValidatorResponse] })
    @Expose()
    @Type(() => MillionsValidatorResponse)
    validators: MillionsValidatorResponse[];

    @ApiProperty({ type: () => MillionsDrawScheduleResponse })
    @Expose()
    @Type(() => MillionsDrawScheduleResponse)
    draw_schedule: MillionsDrawScheduleResponse;

    @ApiProperty({ type: () => MillionsPrizeStrategyResponse })
    @Expose()
    @Type(() => MillionsPrizeStrategyResponse)
    prize_strategy: MillionsPrizeStrategyResponse;

    @ApiProperty()
    @Expose()
    last_draw_created_at: Date;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    available_prize_pool: BalanceResponse;

    constructor(data: Partial<MillionsPoolResponse>) {
        Object.assign(this, data);
    }
}

@Exclude()
export class MillionsPoolRewardsResponse {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    available_prize_pool: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    rewards: BalanceResponse;
}
