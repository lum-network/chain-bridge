import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BeamData } from '@lum-network/sdk-javascript/build/codec/beam/beam';

import { AmountModel } from '@app/database/entities/amount.model';
import { BeamStatus } from '@app/utils';

@Entity({ name: 'beams' })
export class BeamEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    creator_address?: string;

    @Column({ type: 'integer', nullable: true })
    status: BeamStatus;

    @Column({ type: 'varchar', length: 64, nullable: true })
    claim_address?: string;

    @Column({ type: 'boolean', default: false })
    funds_withdrawn: boolean;

    @Column({ type: 'boolean', default: false })
    claimed?: boolean;

    @Column({ type: 'varchar', length: 128, nullable: true })
    cancel_reason?: string;

    @Column({ type: 'boolean', default: false })
    hide_content?: boolean;

    @Column({ type: 'varchar', length: 32 })
    schema: string;

    @Column({ type: 'integer', default: 0 })
    claim_expires_at_block: number;

    @Column({ type: 'integer', default: 0 })
    closes_at_block: number;

    @Column({ type: 'jsonb', nullable: true })
    amount?: AmountModel;

    @Column({ type: 'jsonb' })
    data: BeamData;

    @Column({ type: 'timestamp', nullable: true })
    dispatched_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date = null;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_DATE' })
    created_at?: Date = new Date();

    @UpdateDateColumn({ type: 'timestamp', default: null })
    updated_at?: Date = null;

    @VersionColumn({ type: 'integer', default: 0 })
    nonce?: number = 0;

    constructor(data: Partial<BeamEntity>) {
        Object.assign(this, data);
    }
}
