import { Coin } from '@lum-network/sdk-javascript/build/codec/cosmos/base/v1beta1/coin';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proposals_deposits' })
export class ProposalsDepositsEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'int' })
    proposal_id: number;

    @Column({ type: 'varchar' })
    depositor_address: string;

    @Column({ type: 'jsonb' })
    amount: Coin;

    constructor(data: Partial<ProposalsDepositsEntity>) {
        Object.assign(this, data);
    }
}
