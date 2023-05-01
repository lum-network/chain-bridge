import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'millions_prizes' })
export class MillionsPrizeEntity {
    @PrimaryColumn({ type: 'integer' })
    id: number;

    @Column({ type: 'integer' })
    draw_id: number;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'integer' })
    state: number;

    @Column({ type: 'varchar', length: 128 })
    winner_address: string;

    @Column({ type: 'integer' })
    created_at_height: number;

    @Column({ type: 'integer' })
    updated_at_height: number;

    @Column({ type: 'jsonb' })
    amount: {
        amount: string;
        denom: string;
    };

    @Column({ type: 'date', default: null, nullable: true })
    expires_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    created_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    updated_at?: Date = null;
}
