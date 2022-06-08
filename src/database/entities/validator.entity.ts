import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn} from "typeorm";

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

    @CreateDateColumn({type: 'date', default: () => "CURRENT_DATE"})
    created_at?: Date = new Date;

    @UpdateDateColumn({type: 'date', default: null})
    updated_at?: Date = null;

    @VersionColumn({type: "integer", default: 0})
    nonce?: number = 0;
}
