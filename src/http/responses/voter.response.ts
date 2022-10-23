import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VoterResponse {
    @ApiProperty()
    @Expose({ name: 'id' })
    id: string;

    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: string;

    @ApiProperty()
    @Expose({ name: 'voterAddress' })
    voter_address: string;

    @ApiProperty()
    @Expose({ name: 'voterOperatorAddress' })
    voter_operator_address: string;

    @ApiProperty()
    @Expose({ name: 'voteOption' })
    vote_option: number;

    @ApiProperty()
    @Expose({ name: 'voteWeight' })
    vote_weight: string;

    constructor(data: Partial<VoterResponse>) {
        Object.assign(this, data);
    }
}
