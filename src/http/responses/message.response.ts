import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import Long from 'long';

import { BalanceResponse } from '@app/http/responses/balance.response';
import { CommissionResponse } from '@app/http/responses/commission.response';
import { DescriptionResponse } from '@app/http/responses/description.response';

@Exclude()
export abstract class MessageResponse {
    @ApiProperty()
    @Expose()
    type_url: string;
}

@Exclude()
class SendValueResponse {
    @ApiProperty()
    @Expose({ name: 'fromAddress' })
    from_address: string;

    @ApiProperty()
    @Expose({ name: 'toAddress' })
    to_address: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    amount: BalanceResponse[];
}

@Exclude()
export class SendMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => SendValueResponse })
    @Expose()
    @Type(() => SendValueResponse)
    value: SendValueResponse;
}

@Exclude()
class MultiSendSingleMessage {
    @ApiProperty()
    @Expose()
    address: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    coins: BalanceResponse[];
}

@Exclude()
class MultiSendValueResponse {
    @ApiProperty({ type: () => [MultiSendSingleMessage] })
    @Expose()
    inputs: MultiSendSingleMessage[];

    @ApiProperty({ type: () => [MultiSendSingleMessage] })
    @Expose()
    outputs: MultiSendSingleMessage[];
}

@Exclude()
export class MultiSendResponse extends MessageResponse {
    @ApiProperty({ type: () => MultiSendValueResponse })
    @Expose()
    @Type(() => MultiSendValueResponse)
    value: MultiSendValueResponse;
}

@Exclude()
class CreateValidatorValueResponse {
    @ApiProperty()
    @Expose({ name: 'minSelfDelegation' })
    min_self_delegation: string;

    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @ApiProperty()
    @Expose({ name: 'pubKey' })
    pub_key: any;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    value: BalanceResponse;

    @ApiProperty({ type: () => DescriptionResponse })
    @Expose()
    @Type(() => DescriptionResponse)
    description: DescriptionResponse;

    @ApiProperty({ type: () => CommissionResponse })
    @Expose()
    @Type(() => CommissionResponse)
    commission: string;
}

@Exclude()
class EditValidatorValueResponse {
    @ApiProperty({ type: () => DescriptionResponse })
    @Expose()
    @Type(() => DescriptionResponse)
    description: DescriptionResponse;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @ApiProperty()
    @Expose({ name: 'commissionRate' })
    commission_rate: string;

    @ApiProperty()
    @Expose({ name: 'minSelfDelegation' })
    min_self_delegation: string;
}

@Exclude()
export class EditValidatorMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => EditValidatorValueResponse })
    @Expose()
    @Type(() => EditValidatorValueResponse)
    value: EditValidatorValueResponse;
}

@Exclude()
export class CreateValidatorMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => CreateValidatorValueResponse })
    @Expose()
    @Type(() => CreateValidatorValueResponse)
    value: CreateValidatorValueResponse;
}

@Exclude()
class DelegateValueResponse {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;
}

@Exclude()
export class DelegateMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => DelegateValueResponse })
    @Expose()
    @Type(() => DelegateValueResponse)
    value: DelegateValueResponse;
}

@Exclude()
class UndelegateValueResponse {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;
}

@Exclude()
export class UndelegateMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => UndelegateValueResponse })
    @Expose()
    @Type(() => UndelegateValueResponse)
    value: UndelegateValueResponse;
}

@Exclude()
class GetRewardValueResponse {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}

@Exclude()
export class GetRewardMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => GetRewardValueResponse })
    @Expose()
    @Type(() => GetRewardValueResponse)
    value: GetRewardValueResponse;
}

@Exclude()
class OpenBeamValueResponse {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    creator: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    amount: BalanceResponse;

    @ApiProperty()
    @Expose()
    secret: string;

    //TODO: add reward and review
}

@Exclude()
export class OpenBeamMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => OpenBeamValueResponse })
    @Expose()
    @Type(() => OpenBeamValueResponse)
    value: OpenBeamValueResponse;
}

@Exclude()
class UpdateBeamValueResponse {
    @ApiProperty()
    @Expose()
    updater: string;

    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    amount: BalanceResponse;
}

@Exclude()
export class UpdateBeamMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => UpdateBeamValueResponse })
    @Expose()
    @Type(() => UpdateBeamValueResponse)
    value: UpdateBeamValueResponse;
}

@Exclude()
class ClaimBeamValueResponse {
    @ApiProperty()
    @Expose()
    claimer: string;

    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    secret: string;
}

@Exclude()
export class ClaimBeamMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => ClaimBeamValueResponse })
    @Expose()
    @Type(() => ClaimBeamValueResponse)
    value: ClaimBeamValueResponse;
}

@Exclude()
class SubmitProposalValueResponse {
    @ApiProperty()
    @Expose({ name: 'proposer' })
    proposer_address: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose({ name: 'initialDeposit' })
    initial_deposit: BalanceResponse[];
}

@Exclude()
export class SubmitProposalMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => SubmitProposalValueResponse })
    @Expose()
    @Type(() => SubmitProposalValueResponse)
    value: SubmitProposalValueResponse;
}

@Exclude()
class DepositValueResponse {
    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: any;

    @ApiProperty()
    @Expose({ name: 'depositorAddress' })
    depositor_address: string;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose({ name: 'amount' })
    amount: BalanceResponse[];
}

@Exclude()
export class DepositMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => DepositValueResponse })
    @Expose()
    @Type(() => DepositValueResponse)
    value: DepositValueResponse;
}

@Exclude()
class VoteValueResponse {
    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: Long;

    @ApiProperty()
    @Expose({ name: 'voterAddress' })
    voter_address: string;

    @ApiProperty()
    @Expose({ name: 'option' })
    option: number;
}

@Exclude()
export class VoteMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => VoteValueResponse })
    @Expose()
    @Type(() => VoteValueResponse)
    value: VoteValueResponse;
}

@Exclude()
class CreateVestingAccountValueResponse {
    @ApiProperty()
    @Expose({ name: 'fromAddress' })
    from_address: string;

    @ApiProperty()
    @Expose({ name: 'toAddress' })
    to_address: string;

    @ApiProperty()
    @Expose({ name: 'endTime' })
    end_time: Long;

    @ApiProperty()
    @Expose()
    delayed: boolean;

    @ApiProperty({ type: () => [BalanceResponse] })
    @Expose()
    amount: BalanceResponse[];
}

@Exclude()
export class CreateVestingAccountResponse extends MessageResponse {
    @ApiProperty({ type: () => CreateVestingAccountValueResponse })
    @Expose()
    @Type(() => CreateVestingAccountValueResponse)
    value: CreateVestingAccountValueResponse;
}

@Exclude()
class BeginRedelegateValueResponse {
    @ApiProperty()
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorSrcAddress' })
    validator_src_address: string;

    @ApiProperty()
    @Expose({ name: 'validatorDstAddress' })
    validator_dst_address: string;

    @ApiProperty({ type: () => BalanceResponse })
    @Expose()
    amount: BalanceResponse;
}

@Exclude()
export class BeginRedelegateMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => BeginRedelegateValueResponse })
    @Expose()
    @Type(() => BeginRedelegateValueResponse)
    value: BeginRedelegateValueResponse;
}

@Exclude()
class WithdrawValidatorCommissionValueResponse {
    @ApiProperty()
    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}

@Exclude()
export class WithdrawValidatorCommissionMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => WithdrawValidatorCommissionValueResponse })
    @Expose()
    @Type(() => WithdrawValidatorCommissionValueResponse)
    value: WithdrawValidatorCommissionValueResponse;
}

@Exclude()
class UnjailValueResponse {
    @ApiProperty()
    @Expose({ name: 'validatorAddr' })
    validator_address: string;
}

@Exclude()
export class UnjailMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => UnjailValueResponse })
    @Expose()
    @Type(() => UnjailValueResponse)
    value: UnjailValueResponse;
}

class TimeoutValueResponse {}

@Exclude()
export class TimeoutMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => TimeoutValueResponse })
    @Expose()
    @Type(() => TimeoutValueResponse)
    value: TimeoutValueResponse;
}

class TransferValueResponse {}

@Exclude()
export class TransferMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => TransferValueResponse })
    @Expose()
    @Type(() => TransferValueResponse)
    value: TransferValueResponse;
}

class UpdateClientValueResponse {}

@Exclude()
export class UpdateClientMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => UpdateClientValueResponse })
    @Expose()
    @Type(() => UpdateClientValueResponse)
    value: UpdateClientValueResponse;
}

class AcknowledgementValueResponse {}

@Exclude()
export class AcknowledgementMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => AcknowledgementValueResponse })
    @Expose()
    @Type(() => AcknowledgementValueResponse)
    value: AcknowledgementValueResponse;
}

class RecvPacketValueResponse {}

@Exclude()
export class RecvPacketMessageResponse extends MessageResponse {
    @ApiProperty({ type: () => RecvPacketValueResponse })
    @Expose()
    @Type(() => RecvPacketValueResponse)
    value: RecvPacketValueResponse;
}

class ExecValueResponse {}

@Exclude()
export class ExecMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => ExecValueResponse)
    value: ExecValueResponse;
}

class GrantValueResponse {}

@Exclude()
export class GrantMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => GrantValueResponse)
    value: GrantValueResponse;
}
