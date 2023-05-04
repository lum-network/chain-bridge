import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AmountModel } from '@app/database/entities/amount.model';

@Entity({ name: 'millions_pools' })
export class MillionsPoolEntity {
    @PrimaryColumn({ type: 'integer' })
    id: number;

    @Column({ type: 'varchar', length: 128 })
    denom: string;

    @Column({ type: 'varchar', length: 16 })
    denom_native: string;

    @Column({ type: 'varchar', length: 32 })
    chain_id: string;

    @Column({ type: 'varchar', length: 256 })
    connection_id: string;

    @Column({ type: 'varchar', length: 32 })
    transfer_channel_id: string;

    @Column({ type: 'varchar', length: 32 })
    ica_deposit_port_id: string;

    @Column({ type: 'varchar', length: 32 })
    ica_prize_pool_port_id: string;

    @Column({ type: 'varchar', length: 16 })
    bech32_prefix_acc_address: string;

    @Column({ type: 'varchar', length: 16 })
    bech32_prefix_val_address: string;

    @Column({ type: 'varchar', length: 16 })
    min_deposit_amount: string;

    @Column({ type: 'varchar', length: 128 })
    local_address: string;

    @Column({ type: 'varchar', length: 128 })
    ica_deposit_address: string;

    @Column({ type: 'varchar', length: 128 })
    ica_prize_pool_address: string;

    @Column({ type: 'integer' })
    next_draw_id: number;

    @Column({ type: 'varchar', length: 32 })
    tvl_amount: string;

    @Column({ type: 'integer' })
    depositors_count: number;

    @Column({ type: 'varchar', length: 32 })
    sponsorship_amount: string;

    @Column({ type: 'integer' })
    last_draw_state: number;

    @Column({ type: 'integer' })
    state: number;

    @Column({ type: 'integer' })
    created_at_height: number;

    @Column({ type: 'integer' })
    updated_at_height: number;

    @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
    validators: {
        operator_address: string;
        is_enabled: boolean;
        bonded_amount: string;
    }[];

    @Column({ type: 'jsonb' })
    draw_schedule: {
        initial_draw_at: string;
        draw_delta: {
            seconds: number;
            nanos: number;
        };
    };

    @Column({ type: 'jsonb' })
    prize_strategy: {
        prize_batches: {
            pool_percent: number;
            quantity: number;
            draw_probability: string;
        }[];
    };

    @Column({ type: 'date', default: null, nullable: true })
    last_draw_created_at?: Date = null;

    @Column({ type: 'jsonb' })
    available_prize_pool: AmountModel;

    @Column({ type: 'jsonb' })
    outstanding_prize_pool: AmountModel;

    @Column({ type: 'date', default: null, nullable: true })
    created_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    updated_at?: Date = null;
}
