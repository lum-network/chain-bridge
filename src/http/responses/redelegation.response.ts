import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class RedelegationEntry {
    @ApiProperty()
    @Expose({ name: 'completionTime' })
    completion_time: string;
}

@Exclude()
class RedelegationEntries {
    @ApiProperty()
    @Expose()
    balance: string;

    @ApiProperty({ type: () => RedelegationEntry })
    @Expose({ name: 'redelegationEntry' })
    @Type(() => RedelegationEntry)
    redelegation_entry: RedelegationEntry;
}

@Exclude()
class RedelegationDetails {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorSrcAddress' })
    validator_src_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorDstAddress' })
    validator_dst_address: string;
}

@Exclude()
export class RedelegationResponse {
    @ApiProperty({ type: () => RedelegationDetails })
    @Expose()
    @Type(() => RedelegationDetails)
    redelegation: RedelegationDetails;

    @ApiProperty({ type: () => [RedelegationEntries] })
    @Expose()
    @Type(() => RedelegationEntries)
    entries: RedelegationEntries[];
}
