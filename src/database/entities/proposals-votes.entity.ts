import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'proposals_votes' })
export class ProposalsVotesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    proposal_id: number;

    @Column({ type: 'varchar', length: 42, nullable: true })
    voter_address: string | null;

    @Column({ type: 'varchar', length: 42, nullable: true })
    voter_operator_address: string | null;

    constructor(data: Partial<ProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
