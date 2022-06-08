import {ApiProperty} from "@nestjs/swagger";

import {Exclude, Expose, Type} from "class-transformer";
import {BalanceResponse} from "@app/http";

@Exclude()
export class BeamResponse {
    @ApiProperty()
    @Expose({name: 'creatorAddress'})
    creator_address: string;

    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    status: number;

    @ApiProperty()
    @Expose()
    secret: string;

    @ApiProperty()
    @Expose({name: 'claimAddress'})
    claim_address: string;

    @ApiProperty()
    @Expose({name: 'fundsWithdrawn'})
    funds_withdrawn: boolean;

    @ApiProperty()
    @Expose()
    claimed: boolean;

    @ApiProperty()
    @Expose({name: 'cancelReason'})
    cancel_reason: string;

    @ApiProperty()
    @Expose({name: 'hideContent'})
    hide_content: boolean;

    @ApiProperty()
    @Expose()
    schema: string;

    @ApiProperty()
    @Expose({name: 'claimExpiresAtBlock'})
    claim_expires_at_block: number;

    @ApiProperty()
    @Expose({name: 'closesAtBlock'})
    closes_at_block: number;

    @ApiProperty({type: () => BalanceResponse})
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty()
    @Expose()
    data: any;

    @ApiProperty()
    @Expose({name: 'createdAt'})
    created_at: Date;

    @ApiProperty()
    @Expose({name: 'closed_at'})
    closed_at: Date;
}
