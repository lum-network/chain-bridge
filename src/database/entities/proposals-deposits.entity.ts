import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'proposals_deposits' })
export class ProposalsDepositsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    depositor: string;

    @Column({ type: 'int' })
    proposal_id: number;

    constructor(data: Partial<ProposalsDepositsEntity>) {
        Object.assign(this, data);
    }
}
