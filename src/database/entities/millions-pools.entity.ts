import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'millions_pools' })
export class MillionsPoolsEntity {
    @PrimaryColumn({ type: 'varchar', length: 256 })
    pool_id: string;

    @Column({ type: 'varchar', length: 256 })
    denom: string;

    @Column({ type: 'varchar', length: 256 })
    native_denom: string;

    @Column({ type: 'varchar', length: 256 })
    chain_id: string;

    @Column({ type: 'varchar', length: 256 })
    connection_id: string;

    @Column({ type: 'varchar', length: 256 })
    transfer_channel_id: string;

    @Column({ type: 'varchar', length: 256 })
    controller_port_id: string;

    @Column({ type: 'varchar', length: 256 })
    bech32_prefix_acc_address: string;

    @Column({ type: 'varchar', length: 256 })
    bech32_prefix_val_address: string;

    @Column({ type: 'varchar', length: 256 })
    min_deposit_amount: string;

    @Column({ type: 'varchar', length: 256 })
    module_account_address: string;

    @Column({ type: 'varchar', length: 256 })
    ica_account_address: string;

    @Column({ type: 'varchar', length: 256 })
    next_draw_id: string;

    @Column({ type: 'varchar', length: 256 })
    tvl_amount: string;

    @Column({ type: 'varchar', length: 256 })
    depositors_count: string;

    @Column({ type: 'integer' })
    last_draw_state: number;

    @Column({ type: 'integer' })
    state: number;

    @Column({ type: 'varchar', length: 256 })
    created_at_height: string;

    @Column({ type: 'varchar', length: 256 })
    updated_at_height: string;

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
