import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import Long from 'long';

@Exclude()
class UnbondingEntriesResponse {
    @ApiProperty()
    @Expose()
    balance: string;

    @ApiProperty()
    @Expose({ name: 'completionTime' })
    completion_time: string;

    @ApiProperty()
    @Expose({ name: 'creationHeight' })
    height: Long;
}

@Exclude()
export class UnbondingResponse {
    @ApiProperty({ type: () => [UnbondingEntriesResponse] })
    @Expose()
    @Type(() => UnbondingEntriesResponse)
    entries: UnbondingEntriesResponse[] = [];

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}
