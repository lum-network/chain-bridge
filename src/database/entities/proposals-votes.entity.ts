import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proposals_votes' })
export class ProposalsVotesEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'int' })
    proposal_id: number;

    @Column({ type: 'varchar', length: 42 })
    voter_address: string | null;

    @Column({ type: 'varchar', length: 42 })
    voter_operator_address: string | null;

    constructor(data: Partial<ProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
