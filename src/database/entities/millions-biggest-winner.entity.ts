import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'millions_biggest_winner' })
export class MillionsBiggestWinnerEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'integer' })
    draw_id: number;

    @Column({ type: 'float' })
    raw_amount: number;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'varchar', length: 16 })
    denom_native: string;

    @Column({ type: 'float' })
    sum_of_deposits: number;

    @Column({ type: 'float' })
    apr: number;

    @Column({ type: 'integer' })
    created_at_height: number;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;
}
