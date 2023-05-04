import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';
import { LumMessages, LumTypes } from '@lum-network/sdk-javascript';

import { BalanceResponse } from '@app/http/responses/balance.response';
import {
    AcknowledgementMessageResponse,
    BeginRedelegateMessageResponse,
    ClaimBeamMessageResponse,
    ClaimPrizeMessageResponse,
    CreateValidatorMessageResponse,
    CreateVestingAccountResponse,
    DelegateMessageResponse,
    DepositMessageResponse,
    DepositRetryMessageResponse,
    EditValidatorMessageResponse,
    ExecMessageResponse,
    GetRewardMessageResponse,
    GrantMessageResponse,
    MessageResponse,
    MillionsDepositMessageResponse,
    MultiSendResponse,
    OpenBeamMessageResponse,
    RecvPacketMessageResponse,
    RegisterPoolMessageResponse,
    SendMessageResponse,
    SubmitProposalMessageResponse,
    TimeoutMessageResponse,
    TransferMessageResponse,
    UndelegateMessageResponse,
    UnjailMessageResponse,
    UpdateBeamMessageResponse,
    UpdateClientMessageResponse,
    UpdatePoolMessageResponse,
    VoteMessageResponse,
    WithdrawDepositMessageResponse,
    WithdrawDepositRetryMessageResponse,
    WithdrawValidatorCommissionMessageResponse,
} from '@app/http/responses/message.response';

@Exclude()
export class TransactionResponse {
    @ApiProperty()
    @Expose()
    height: number;

    @ApiProperty()
    @Expose()
    hash: string;

    @ApiProperty()
    @Expose()
    block_hash: string;

    @ApiProperty()
    @Expose()
    action: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    auto_claim_reward: BalanceResponse;

    @ApiProperty()
    @Expose()
    success: boolean;

    @ApiProperty()
    @Expose()
    gas_wanted: number;

    @ApiProperty()
    @Expose()
    gas_used: number;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    @Type(() => BalanceResponse)
    fees: BalanceResponse[];

    @ApiProperty({ isArray: true })
    @Expose()
    addresses: string[];

    @ApiProperty()
    @Expose()
    memo: string;

    @ApiProperty()
    @Expose()
    time: Date;

    @ApiProperty({ type: () => [MessageResponse] })
    @Expose()
    @Type(() => MessageResponse, {
        discriminator: {
            property: 'type_url',
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
                { value: CreateVestingAccountResponse, name: LumMessages.MsgCreateVestingAccountUrl },
                { value: BeginRedelegateMessageResponse, name: LumMessages.MsgBeginRedelegateUrl },
                { value: WithdrawValidatorCommissionMessageResponse, name: LumMessages.MsgWithdrawValidatorCommissionUrl },
                { value: UnjailMessageResponse, name: LumMessages.MsgUnjailUrl },
                { value: TimeoutMessageResponse, name: LumMessages.MsgTimeoutUrl },
                { value: TransferMessageResponse, name: LumMessages.MsgTransferUrl },
                { value: UpdateClientMessageResponse, name: LumMessages.MsgUpdateClientUrl },
                { value: AcknowledgementMessageResponse, name: LumMessages.MsgAcknowledgementUrl },
                { value: RecvPacketMessageResponse, name: LumMessages.MsgRecvPacketUrl },
                { value: ExecMessageResponse, name: LumMessages.MsgExecUrl },
                { value: GrantMessageResponse, name: LumMessages.MsgGrantUrl },
                { value: MillionsDepositMessageResponse, name: LumMessages.MsgMillionsDepositUrl },
                { value: ClaimPrizeMessageResponse, name: LumMessages.MsgClaimPrizeUrl },
                { value: WithdrawDepositMessageResponse, name: LumMessages.MsgWithdrawDepositUrl },
                { value: WithdrawDepositRetryMessageResponse, name: LumMessages.MsgWithdrawDepositRetryUrl },
                { value: DepositRetryMessageResponse, name: LumMessages.MsgDepositRetryUrl },
                { value: RegisterPoolMessageResponse, name: LumMessages.MsgRegisterPoolUrl },
                { value: UpdatePoolMessageResponse, name: LumMessages.MsgUpdatePoolUrl },
            ],
        },
        keepDiscriminatorProperty: true,
    })
    messages: MessageResponse[];

    @ApiProperty()
    @Expose()
    message_type: string | null;

    @ApiProperty()
    @Expose()
    messages_count: number;

    @ApiProperty()
    @Expose()
    raw_logs: LumTypes.Log[];

    constructor(data: Partial<TransactionResponse>) {
        Object.assign(this, data);
    }
}
