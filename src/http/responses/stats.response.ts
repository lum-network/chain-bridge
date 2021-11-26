import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StatsResponse {
    @Expose()
    inflation: string;

    @Expose({ name: 'chainId' })
    chain_id: string;

    @Expose({ name: 'totalSupply' })
    total_supply: string;

    constructor(data: Partial<StatsResponse>) {
        Object.assign(this, data);
    }
}
