import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'millions_draws' })
export class MillionsDrawEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'integer' })
    draw_id: number;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'integer' })
    state: number;

    @Column({ type: 'integer' })
    error_state: number;

    @Column({ type: 'varchar', length: 128 })
    rand_seed: string;

    @Column({ type: 'varchar', length: 64 })
    prize_pool_fresh_amount: string;

    @Column({ type: 'varchar', length: 64 })
    prize_pool_remains_amount: string;

    @Column({ type: 'integer' })
    total_winners: number;

    @Column({ type: 'varchar', length: 64 })
    total_winners_amount: string;

    @Column({ type: 'integer' })
    created_at_height: number;

    @Column({ type: 'integer' })
    updated_at_height: number;

    @Column({ type: 'jsonb' })
    prize_pool: {
        amount: string;
        denom: string;
    };

    @Column({ type: 'float' })
    usd_token_value: number;

    @Column({ type: 'date', default: null, nullable: true })
    created_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    updated_at?: Date = null;
}
