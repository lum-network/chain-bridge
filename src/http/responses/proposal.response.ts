import { ApiProperty } from '@nestjs/swagger';

import { Expose, Exclude, Type } from 'class-transformer';
import Long from 'long';

import { BalanceResponse } from '@app/http/responses/balance.response';

@Exclude()
export class ResultResponse {
    @ApiProperty()
    @Expose()
    yes: number;

    @ApiProperty()
    @Expose()
    no: number;

    @ApiProperty()
    @Expose()
    abstain: number;

    @ApiProperty()
    @Expose({ name: 'noWithVeto' })
    no_with_veto: number;
}

@Exclude()
class ContentPlanResponse {
    @ApiProperty()
    @Expose()
    info: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    time: number;

    @ApiProperty()
    @Expose()
    height: number;
}

@Exclude()
class ContentResponse {
    @ApiProperty()
    @Expose()
    title: string;

    @ApiProperty()
    @Expose()
    description: string;

    @ApiProperty()
    @Expose()
    @Type(() => ContentPlanResponse)
    plan?: ContentPlanResponse = null;
}

@Exclude()
export class ProposalResponse {
    @ApiProperty()
    @Expose({ name: 'id' })
    proposal_id: Long;

    @ApiProperty()
    @Expose()
    type_url: string;

    @ApiProperty()
    @Expose({ name: 'submitted_at' })
    submit_time: string;

    @ApiProperty()
    @Expose()
    deposit_end_time: string;

    @ApiProperty()
    @Expose()
    voting_start_time: string;

    @ApiProperty()
    @Expose()
    voting_end_time: string;

    @ApiProperty()
    @Expose()
    status: number;

    @ApiProperty()
    @Expose()
    metadata: number;

    @ApiProperty({ type: () => ContentResponse })
    @Expose()
    @Type(() => ContentResponse)
    content: ContentResponse;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose({ name: 'total_deposits' })
    @Type(() => BalanceResponse)
    total_deposit: BalanceResponse[];

    @ApiProperty({ type: () => ResultResponse })
    @Expose({ name: 'final_tally_result' })
    @Type(() => ResultResponse)
    final_result: ResultResponse;

    constructor(data: Partial<ProposalResponse>) {
        Object.assign(this, data);
    }
}
