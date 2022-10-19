import { VoteOption } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proposals_votes' })
export class ProposalVoteEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'smallint' })
    proposal_id: number;

    @Column({ type: 'varchar', length: 42 })
    voter_address: string;

    @Column({ type: 'varchar', length: 49 })
    voter_operator_address: string;

    @Column({ type: 'smallint' })
    vote_option: VoteOption;

    @Column({ type: 'bigint' })
    vote_weight: string;

    constructor(data: Partial<ProposalVoteEntity>) {
        Object.assign(this, data);
    }
}
