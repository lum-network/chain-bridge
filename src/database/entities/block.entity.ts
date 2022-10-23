import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { TransactionEntity } from '@app/database/entities/transaction.entity';

@Entity({ name: 'blocks' })
export class BlockEntity {
    @PrimaryColumn({ type: 'integer' })
    height: number;

    @Column({ type: 'varchar', length: 256 })
    hash: string;

    @Column({ type: 'timestamp' })
    time: Date;

    @Column({ type: 'integer', default: 0 })
    tx_count = 0;

    @Column({ type: 'jsonb', default: () => "'[]'", array: false })
    tx_hashes: string[] = [];

    @Column({ type: 'varchar', length: 128 })
    proposer_address: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    operator_address: string = null;

    @Column({ type: 'json' })
    raw_block: string;

    @CreateDateColumn({ type: 'date', default: () => 'CURRENT_DATE' })
    created_at?: Date = new Date();

    @UpdateDateColumn({ type: 'date', default: null })
    updated_at?: Date = null;

    @VersionColumn({ type: 'integer', default: 0 })
    nonce?: number = 0;

    @OneToMany(() => TransactionEntity, (tx) => tx.block)
    transactions: TransactionEntity[];

    constructor(props?: Partial<BlockEntity>) {
        Object.assign(this, props);
    }
}
