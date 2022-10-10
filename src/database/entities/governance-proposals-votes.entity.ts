import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'governance_proposals_votes' })
export class GovernanceProposalsVotesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    voters: string;

    @Column({ type: 'int' })
    proposal_id: number;

    constructor(data: Partial<GovernanceProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
