import { Coin } from '@lum-network/sdk-javascript';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proposals_deposits' })
export class ProposalDepositEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'smallint' })
    proposal_id: number;

    @Column({ type: 'text' })
    depositor_address: string;

    @Column({ type: 'jsonb' })
    amount: Coin;

    constructor(data: Partial<ProposalDepositEntity>) {
        Object.assign(this, data);
    }
}
