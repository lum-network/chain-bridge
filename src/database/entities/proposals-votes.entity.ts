import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'proposals_votes' })
export class ProposalsVotesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    voter: string;

    @Column({ type: 'int' })
    proposal_id: number;

    constructor(data: Partial<ProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
