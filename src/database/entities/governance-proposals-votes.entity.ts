import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'governance_proposals_votes' })
export class GovernanceProposalsVotesEntity {
    @PrimaryColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    voters: string;

    constructor(data: Partial<GovernanceProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
