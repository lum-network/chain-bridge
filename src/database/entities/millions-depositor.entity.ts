import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'millions_depositors' })
export class MillionsDepositorEntity {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    id: string;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'bigint' })
    amount: number;

    @Column({ type: 'integer' })
    rank: number;

    @Column({ type: 'varchar', length: 64 })
    address: string;

    @Column({ type: 'varchar', length: 16 })
    native_denom: string;
}
