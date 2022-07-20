import {Column, Entity, PrimaryColumn} from "typeorm";
import {AmountModel} from "@app/database/entities/amount.model";

@Entity({name: 'validator_delegations'})
export class ValidatorDelegationEntity {
    @PrimaryColumn({type: 'varchar', length: 128})
    delegator_address: string;

    @PrimaryColumn({type: 'varchar', length: 128})
    validator_address: string;

    @Column("bigint", {nullable: true})
    shares: number;

    @Column({type: 'jsonb'})
    balance: AmountModel;

    constructor(data: Partial<ValidatorDelegationEntity>) {
        Object.assign(this, data);
    }
}
