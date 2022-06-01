import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "validators"})
export class ValidatorEntity {
    @PrimaryColumn({type: "varchar", length: 256})
    proposer_address: string;

    @Column({type: "varchar", length: 256})
    consensus_address: string;

    @Column({type: "varchar", length: 256})
    consensus_pubkey: string;

    @Column({type: "varchar", length: 256, nullable: true})
    operator_address?: string;

    @Column({type: "varchar", length: 256, nullable: true})
    account_address?: string;
}
