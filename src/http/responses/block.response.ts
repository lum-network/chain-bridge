import { Exclude, Expose, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { TransactionResponse } from '@app/http/responses/transaction.response';

@Exclude()
export class BlockResponse {
    @ApiProperty()
    @Expose()
    chain_id: string;

    @ApiProperty()
    @Expose()
    hash: string;

    @ApiProperty()
    @Expose()
    height: number;

    @ApiProperty()
    @Expose()
    time: Date;

    @ApiProperty()
    @Expose()
    tx_count: number;

    @ApiProperty()
    @Expose()
    proposer_address: string;

    @ApiProperty()
    @Expose()
    operator_address: string;

    @ApiProperty({ type: () => [TransactionResponse] })
    @Expose()
    @Type(() => TransactionResponse)
    transactions: Partial<TransactionResponse>[] = [];

    constructor(data: Partial<BlockResponse>) {
        Object.assign(this, data);
    }
}
