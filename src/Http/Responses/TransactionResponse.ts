import {Exclude, Expose} from "class-transformer";

@Exclude()
export default class TransactionResponse {
    @Expose()
    height: number;

    @Expose()
    hash: string;

    @Expose()
    action: string;

    @Expose()
    amount: string;

    @Expose()
    success: boolean;

    @Expose()
    gas_wanted: number;

    @Expose()
    gas_used: number;

    @Expose()
    from_address: string;

    @Expose()
    to_address: string;

    @Expose()
    name: string;

    @Expose()
    dispatched_at: Date;

    // This JSON field is returned as string to be parsed frontend side
    @Expose()
    msgs: string;

    constructor(data: Partial<TransactionResponse>) {
        Object.assign(this, data);
    }
}
