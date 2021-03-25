import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class CommissionResponse {
    @Expose()
    rate: string;

    @Expose({ name: 'maxRate' })
    max_rate: string;

    @Expose({ name: 'maxChangeRate' })
    max_change_rate: string;
}
