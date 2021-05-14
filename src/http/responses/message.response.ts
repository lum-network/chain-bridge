import { Exclude, Expose, Transform, Type } from 'class-transformer';
import Long from 'long';
import { BalanceResponse } from '@app/http/responses/balance.response';
import { CommissionResponse } from '@app/http/responses/commission.response';
import { DescriptionResponse } from '@app/http/responses/description.response';

@Exclude()
export abstract class MessageResponse {
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

@Exclude()
class MultiSendValueResponse {}

@Exclude()
export class MultiSendResponse extends MessageResponse {
    @Expose()
    @Type(() => MultiSendValueResponse)
    value: MultiSendValueResponse;
}

@Exclude()
class CreateValidatorValueResponse {
    @Expose({ name: 'minSelfDelegation' })
    min_self_delegation: string;

    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose({ name: 'pubKey' })
    pub_key: any;

    @Expose()
    @Type(() => BalanceResponse)
    value: BalanceResponse;

    @Expose()
    @Type(() => DescriptionResponse)
    description: DescriptionResponse;

    @Expose()
    @Type(() => CommissionResponse)
    commission: string;
}

@Exclude()
class EditValidatorValueResponse {
    @Expose()
    @Type(() => DescriptionResponse)
    description: DescriptionResponse;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose({ name: 'commissionRate' })
    commission_rate: string;

    @Expose({ name: 'minSelfDelegation' })
    min_self_delegation: string;
}

@Exclude()
export class EditValidatorMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => EditValidatorValueResponse)
    value: EditValidatorValueResponse;
}

@Exclude()
export class CreateValidatorMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => CreateValidatorValueResponse)
    value: CreateValidatorValueResponse;
}

@Exclude()
class DelegateValueResponse {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;
}

@Exclude()
export class DelegateMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => DelegateValueResponse)
    value: DelegateValueResponse;
}

@Exclude()
class UndelegateValueResponse {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;

    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;
}

@Exclude()
export class UndelegateMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => UndelegateValueResponse)
    value: UndelegateValueResponse;
}

@Exclude()
class GetRewardValueResponse {
    @Expose({ name: 'delegatorAddress' })
    delegator_address: string;

    @Expose({ name: 'validatorAddress' })
    validator_address: string;
}

@Exclude()
export class GetRewardMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => GetRewardValueResponse)
    value: GetRewardValueResponse;
}

@Exclude()
class OpenBeamValueResponse {
    @Expose()
    id: string;

    @Expose()
    creator: string;

    @Expose()
    @Transform(value => value.low)
    amount: number;

    @Expose()
    secret: string;

    //TODO: add reward and review
}

@Exclude()
export class OpenBeamMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => OpenBeamValueResponse)
    value: OpenBeamValueResponse;
}

@Exclude()
class UpdateBeamValueResponse {
    @Expose()
    updater: string;

    @Expose()
    id: string;

    @Expose()
    @Transform(value => value.low)
    amount: number;
}

@Exclude()
export class UpdateBeamMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => UpdateBeamValueResponse)
    value: UpdateBeamValueResponse;
}

@Exclude()
class CancelBeamValueResponse {
    @Expose()
    updater: string;

    @Expose()
    id: string;
}

@Exclude()
export class CancelBeamMessageResponse extends MessageResponse {
    @Expose()
    @Type(() => CancelBeamValueResponse)
    value: CancelBeamValueResponse;
}

@Exclude()
class ClaimBeamValueResponse {
    @Expose()
    claimer: string;

    @Expose()
    id: string;

    @Expose()
    secret: string;
}

@Exclude()
export class ClaimBeamMessageResponse extends MessageResponse {
    @Expose()
    value: ClaimBeamValueResponse;
}