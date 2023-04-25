import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'millions_pools' })
export class MillionsPoolsEntity {
    @PrimaryColumn({ type: 'integer' })
    id: number;

    @Column({ type: 'varchar', length: 16 })
    denom: string;

    @Column({ type: 'varchar', length: 64 })
    denom_native: string;

    @Column({ type: 'varchar', length: 32 })
    chain_id: string;

    @Column({ type: 'varchar', length: 256 })
    connection_id: string;

    @Column({ type: 'varchar', length: 32 })
    transfer_channel_id: string;

    @Column({ type: 'varchar', length: 32 })
    controller_port_id: string;

    @Column({ type: 'varchar', length: 16 })
    bech32_prefix_acc_address: string;

    @Column({ type: 'varchar', length: 16 })
    bech32_prefix_val_address: string;

    @Column({ type: 'varchar', length: 256 })
    min_deposit_amount: string;

    @Column({ type: 'varchar', length: 128 })
    module_account_address: string;

    @Column({ type: 'varchar', length: 128 })
    ica_account_address: string;

    @Column({ type: 'integer' })
    next_draw_id: number;

    @Column({ type: 'varchar', length: 256 })
    tvl_amount: string;

    @Column({ type: 'integer' })
    depositors_count: number;

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
        rewards_amount: {
            amount: string;
            denom: string;
        }[];
    }[];

    @Column({ type: 'jsonb' })
    draw_schedule: {
        initial_draw_at: string;
        draw_delta: {
            seconds: string;
            nanos: string;
        };
    };

    @Column({ type: 'jsonb' })
    prize_strategy: {
        prize_batches: {
            pool_percent: string;
            quantity: string;
            draw_probability: string;
        }[];
    };

    @Column({ type: 'date', default: null, nullable: true })
    last_draw_created_at?: Date = null;

    @Column({ type: 'jsonb' })
    available_prize_pool: {
        amount: string;
        denom: string;
    };

    @CreateDateColumn({ type: 'date', default: () => 'CURRENT_DATE' })
    created_at?: Date = new Date();

    @UpdateDateColumn({ type: 'date', default: null })
    updated_at?: Date = null;
}
