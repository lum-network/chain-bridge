import {Exclude, Expose, Type} from "class-transformer";

@Exclude()
export class ValidatorDescriptionResponse {
    @Expose()
    moniker: string;

    @Expose()
    identity: string;

    @Expose()
    website: string;

    @Expose()
    security_contact: string;

    @Expose()
    details: string;

    constructor(data: Partial<ValidatorDescriptionResponse>) {
        Object.assign(this, data);
    }
}

@Exclude()
export default class ValidatorResponse {
    @Expose()
    jailed: boolean;

    @Expose()
    status: number;

    @Expose()
    tokens: string;

    @Expose()
    delegator_shares: string;

    @Expose()
    @Type(() => ValidatorDescriptionResponse)
    description: ValidatorDescriptionResponse;

    constructor(data: Partial<ValidatorResponse>) {
        Object.assign(this, data);
    }
}
