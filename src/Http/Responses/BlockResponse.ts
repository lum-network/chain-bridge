import { Exclude, Expose, Type } from 'class-transformer';
import TransactionResponse from '@app/Http/Responses/TransactionResponse';

@Exclude()
export default class BlockResponse {
    @Expose()
    chain_id: string;

    @Expose()
    hash: string;

    @Expose()
    height: number;

    @Expose()
    time: Date;

    @Expose()
    tx_count: number;

    @Expose()
    proposer_address: string;

    @Expose()
    operator_address: string;

    @Expose()
    @Type(() => TransactionResponse)
    transactions: Partial<TransactionResponse>[];

    constructor(data: Partial<BlockResponse>) {
        Object.assign(this, data);
    }
}
