import { VoteOption } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proposals_votes' })
export class ProposalsVotesEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'int' })
    proposal_id: number;

    @Column({ type: 'varchar' })
    voter_address: string;

    @Column({ type: 'varchar' })
    voter_operator_address: string;

    @Column({ type: 'int' })
    vote_option: VoteOption;

    @Column({ type: 'varchar' })
    vote_weight: string;

    constructor(data: Partial<ProposalsVotesEntity>) {
        Object.assign(this, data);
    }
}
