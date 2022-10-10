import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'governance_proposals_deposits' })
export class GovernanceProposalsDepositsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    depositor: string;

    @Column({ type: 'int' })
    proposal_id: number;

    constructor(data: Partial<GovernanceProposalsDepositsEntity>) {
        Object.assign(this, data);
    }
}
