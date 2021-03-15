import { Exclude, Expose, Type } from 'class-transformer';
import BalanceResponse from '@app/Http/Responses/BalanceResponse';
import DescriptionResponse from '@app/Http/Responses/DescriptionResponse';
import CommissionResponse from '@app/Http/Responses/CommissionResponse';

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
