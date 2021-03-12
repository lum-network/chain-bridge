import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';

@Exclude()
export default abstract class MessageResponse {
    @Expose({ name: 'typeUrl' })
    type_url: string;
}

@Exclude()
class SendValueResponse {
    @Expose({ name: 'fromAddress' })
    from_address: string;

    @Expose({ name: 'toAddress' })
    to_address: string;

    @Expose()
    amount: BalanceResponse[];
}

@Exclude()
export class SendMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => SendValueResponse)
    value: SendValueResponse;
}
