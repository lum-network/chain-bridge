import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StatsResponse {
    @Expose()
    inflation: string;

    constructor(data: Partial<StatsResponse>) {
        Object.assign(this, data);
    }
}
