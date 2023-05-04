import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'millions_prizes' })
export class MillionsPrizeEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'integer' })
    prize_id: number;

    @Column({ type: 'integer' })
    draw_id: number;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'varchar', length: 128 })
    winner_address: string;

    @Column({ type: 'integer' })
    created_at_height: number;

    @Column({ type: 'integer' })
    updated_at_height: number;

    @Column({ type: 'varchar', length: 64 })
    raw_amount: string;

    @Column({ type: 'varchar', length: 16 })
    denom_native: string;

    @Column({ type: 'jsonb' })
    amount: {
        amount: string;
        denom: string;
    };

    @Column({ type: 'float' })
    usd_token_value: number;

    @Column({ type: 'date', default: null, nullable: true })
    expires_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    created_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    updated_at?: Date = null;
}
