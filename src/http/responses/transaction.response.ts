import { Exclude, Expose, Type } from 'class-transformer';
import { LumMessages, LumTypes } from '@lum-network/sdk-javascript';
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
    SubmitProposalMessageResponse,
    DepositMessageResponse,
    VoteMessageResponse,
    BeginRedelegateMessageResponse,
    WithdrawValidatorCommissionMessageResponse,
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
    auto_claim_reward: BalanceResponse;

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
                { value: SubmitProposalMessageResponse, name: LumMessages.MsgSubmitProposalUrl },
                { value: DepositMessageResponse, name: LumMessages.MsgDepositUrl },
                { value: VoteMessageResponse, name: LumMessages.MsgVoteUrl },
                { value: BeginRedelegateMessageResponse, name: LumMessages.MsgBeginRedelegateUrl },
                { value: WithdrawValidatorCommissionMessageResponse, name: LumMessages.MsgWithdrawValidatorCommissionUrl },
            ],
        },
        keepDiscriminatorProperty: true,
    })
    messages: MessageResponse[];

    @Expose()
    message_type: string | null;

    @Expose()
    messages_count: number;

    @Expose()
    raw_logs: LumTypes.Log[];

    constructor(data: Partial<TransactionResponse>) {
        Object.assign(this, data);
    }
}
