import {Exclude, Expose} from "class-transformer";

@Exclude()
export default class BlockResponse {
    @Expose()
    chain_id: string;

    @Expose()
    hash: string;

    @Expose()
    height: number;

    @Expose()
    dispatched_at: Date;

    @Expose()
    num_txs: number;

    @Expose()
    total_txs: number;

    @Expose()
    proposer_address: string;

    @Expose()
    transactions: string[];

    constructor(data: Partial<BlockResponse>) {
        Object.assign(this, data);
    }
}
