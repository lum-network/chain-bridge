import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { Log } from '@lum-network/sdk-javascript';
import { MsgSend, MsgMultiSend } from '@lum-network/sdk-javascript/build/codegen/cosmos/bank/v1beta1/tx';
import { MsgBeginRedelegate, MsgCreateValidator, MsgDelegate, MsgEditValidator, MsgUndelegate } from '@lum-network/sdk-javascript/build/codegen/cosmos/staking/v1beta1/tx';
import { MsgWithdrawDelegatorReward, MsgWithdrawValidatorCommission } from '@lum-network/sdk-javascript/build/codegen/cosmos/distribution/v1beta1/tx';
import { MsgClaimBeam, MsgOpenBeam, MsgUpdateBeam } from '@lum-network/sdk-javascript/build/codegen/lum/network/beam/tx';
import { MsgDeposit, MsgSubmitProposal, MsgVote } from '@lum-network/sdk-javascript/build/codegen/cosmos/gov/v1/tx';
import { MsgCreateVestingAccount } from '@lum-network/sdk-javascript/build/codegen/cosmos/vesting/v1beta1/tx';
import { MsgUnjail } from '@lum-network/sdk-javascript/build/codegen/cosmos/slashing/v1beta1/tx';
import { MsgAcknowledgement, MsgRecvPacket, MsgTimeout } from '@lum-network/sdk-javascript/build/codegen/ibc/core/channel/v1/tx';
import { MsgTransfer } from '@lum-network/sdk-javascript/build/codegen/ibc/applications/transfer/v1/tx';
import { MsgUpdateClient } from '@lum-network/sdk-javascript/build/codegen/ibc/core/client/v1/tx';
import { MsgExec, MsgGrant } from '@lum-network/sdk-javascript/build/codegen/cosmos/authz/v1beta1/tx';
import {
    MsgClaimPrize,
    MsgDeposit as MsgMillionsDeposit,
    MsgWithdrawDeposit as MsgMillionsWithdrawDeposit,
    MsgDepositRetry as MsgMillionsDepositRetry,
    MsgWithdrawDepositRetry as MsgMillionsWithdrawDepositRetry,
    MsgRegisterPool,
    MsgUpdatePool,
} from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/tx';

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
                { value: SendMessageResponse, name: MsgSend.typeUrl },
                { value: MultiSendResponse, name: MsgMultiSend.typeUrl },
                { value: DelegateMessageResponse, name: MsgDelegate.typeUrl },
                { value: UndelegateMessageResponse, name: MsgUndelegate.typeUrl },
                { value: CreateValidatorMessageResponse, name: MsgCreateValidator.typeUrl },
                { value: EditValidatorMessageResponse, name: MsgEditValidator.typeUrl },
                { value: GetRewardMessageResponse, name: MsgWithdrawDelegatorReward.typeUrl },
                { value: OpenBeamMessageResponse, name: MsgOpenBeam.typeUrl },
                { value: UpdateBeamMessageResponse, name: MsgUpdateBeam.typeUrl },
                { value: ClaimBeamMessageResponse, name: MsgClaimBeam.typeUrl },
                { value: SubmitProposalMessageResponse, name: MsgSubmitProposal.typeUrl },
                { value: DepositMessageResponse, name: MsgDeposit.typeUrl },
                { value: VoteMessageResponse, name: MsgVote.typeUrl },
                { value: CreateVestingAccountResponse, name: MsgCreateVestingAccount.typeUrl },
                { value: BeginRedelegateMessageResponse, name: MsgBeginRedelegate.typeUrl },
                { value: WithdrawValidatorCommissionMessageResponse, name: MsgWithdrawValidatorCommission.typeUrl },
                { value: UnjailMessageResponse, name: MsgUnjail.typeUrl },
                { value: TimeoutMessageResponse, name: MsgTimeout.typeUrl },
                { value: TransferMessageResponse, name: MsgTransfer.typeUrl },
                { value: UpdateClientMessageResponse, name: MsgUpdateClient.typeUrl },
                { value: AcknowledgementMessageResponse, name: MsgAcknowledgement.typeUrl },
                { value: RecvPacketMessageResponse, name: MsgRecvPacket.typeUrl },
                { value: ExecMessageResponse, name: MsgExec.typeUrl },
                { value: GrantMessageResponse, name: MsgGrant.typeUrl },
                { value: MillionsDepositMessageResponse, name: MsgMillionsDeposit.typeUrl },
                { value: ClaimPrizeMessageResponse, name: MsgClaimPrize.typeUrl },
                { value: WithdrawDepositMessageResponse, name: MsgMillionsWithdrawDeposit.typeUrl },
                { value: WithdrawDepositRetryMessageResponse, name: MsgMillionsWithdrawDepositRetry.typeUrl },
                { value: DepositRetryMessageResponse, name: MsgMillionsDepositRetry.typeUrl },
                { value: RegisterPoolMessageResponse, name: MsgRegisterPool.typeUrl },
                { value: UpdatePoolMessageResponse, name: MsgUpdatePool.typeUrl },
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
    raw_logs: Log[];

    constructor(data: Partial<TransactionResponse>) {
        Object.assign(this, data);
    }
}
