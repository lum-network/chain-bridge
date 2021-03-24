import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';
import MessageResponse, { SendMessageResponse } from '@app/Http/Responses/MessageResponse';
import { LumMessages } from '@lum-network/sdk-javascript';

@Exclude()
export default class TransactionResponse {
    @Expose()
    height: number;

    @Expose()
    hash: string;

    @Expose()
    block_hash: string;

    @Expose()
    action: string;

    @Expose()
    amount: BalanceResponse;

    @Expose()
    success: boolean;

    @Expose()
    gas_wanted: number;

    @Expose()
    gas_used: number;

    @Expose()
    addresses: string[];

    @Expose()
    memo: string;

    @Expose()
    time: Date;

    @Expose()
    @Type(() => MessageResponse, {
        discriminator: {
            property: 'typeUrl',
            subTypes: [{ value: SendMessageResponse, name: LumMessages.MsgSendUrl }],
        },
        keepDiscriminatorProperty: true,
    })
    messages: MessageResponse[];

    @Expose()
    message_type: string | null;

    @Expose()
    messages_count: number;

    constructor(data: Partial<TransactionResponse>) {
        Object.assign(this, data);
    }
}
