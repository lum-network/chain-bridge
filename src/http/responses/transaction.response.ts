import { Exclude, Expose, Type } from 'class-transformer';
import { LumMessages } from '@lum-network/sdk-javascript';
import { BalanceResponse } from '@app/http/responses/balance.response';
import {
    ClaimBeamMessageResponse,
    CreateValidatorMessageResponse,
    DelegateMessageResponse,
    EditValidatorMessageResponse,
    GetRewardMessageResponse,
    MessageResponse,
    MultiSendResponse,
    OpenBeamMessageResponse,
    SendMessageResponse,
    UndelegateMessageResponse,
    UpdateBeamMessageResponse,
} from '@app/http/responses/message.response';

@Exclude()
export class TransactionResponse {
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
    fees: BalanceResponse[];

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
            subTypes: [
                { value: SendMessageResponse, name: LumMessages.MsgSendUrl },
                { value: MultiSendResponse, name: LumMessages.MsgMultiSendUrl },
                { value: DelegateMessageResponse, name: LumMessages.MsgDelegateUrl },
                { value: UndelegateMessageResponse, name: LumMessages.MsgUndelegateUrl },
                { value: CreateValidatorMessageResponse, name: LumMessages.MsgCreateValidatorUrl },
                { value: EditValidatorMessageResponse, name: LumMessages.MsgEditValidatorUrl },
                { value: GetRewardMessageResponse, name: LumMessages.MsgWithdrawDelegatorRewardUrl },
                { value: OpenBeamMessageResponse, name: LumMessages.MsgOpenBeamUrl },
                { value: UpdateBeamMessageResponse, name: LumMessages.MsgUpdateBeamUrl },
                { value: ClaimBeamMessageResponse, name: LumMessages.MsgClaimBeamUrl },
            ],
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
