import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AmountModel } from '@app/database/entities/amount.model';

export class ProposalFinalTallyResult {
    yes: number;
    abstain: number;
    no: number;
    no_with_veto: number;
}

@Entity({ name: 'proposals' })
export class ProposalEntity {
    @PrimaryColumn()
    id: number;

    @Column({ type: 'varchar', length: 128, nullable: true })
    type_url: string;

    @Column({ type: 'smallint' })
    status: number;

    @Column({ type: 'jsonb', nullable: true })
    total_deposits: AmountModel[] = [];

    @Column({ type: 'varchar', length: 256, nullable: true })
    metadata: string = null;

    @Column({ type: 'jsonb', nullable: true })
    final_tally_result: ProposalFinalTallyResult = {
        yes: 0,
        abstain: 0,
        no_with_veto: 0,
        no: 0,
    };

    @Column({ type: 'jsonb', nullable: true })
    content: string = null;

    @Column({ type: 'date' })
    submitted_at: Date;

    @Column({ type: 'date' })
    deposit_end_time: Date;

    @Column({ type: 'date' })
    voting_start_time: Date;

    @Column({ type: 'date' })
    voting_end_time: Date;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;

    constructor(data: Partial<ProposalEntity>) {
        Object.assign(this, data);
    }
}
