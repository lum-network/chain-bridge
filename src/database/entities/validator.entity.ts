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

    @Column("varchar", {length: 128, nullable: true})
    displayed_name: string;

    @Column("jsonb")
    description: {
        moniker: string;
        identity: string;
        website: string;
        security_contact: string;
        details: string;
    };

    @Column("boolean")
    jailed: boolean;

    @Column("integer")
    status: number;

    @Column("bigint")
    tokens: number;

    @Column("float", {nullable: true})
    delegator_shares: number;

    @Column("jsonb")
    commission: {
        rates: {
            current_rate: string;
            max_rate: string;
            max_change_rate: string;
        },
        last_updated_at: Date;
    };

    @Column("integer", {default: 0})
    bonded_height: number;

    @Column("boolean", {default: false})
    tombstoned: boolean;

    @Column("float", {default: 100.0})
    uptime: number;

    @CreateDateColumn({type: 'date', default: () => "CURRENT_DATE"})
    created_at?: Date = new Date;

    @UpdateDateColumn({type: 'date', default: null})
    updated_at?: Date = null;

    @VersionColumn({type: "integer", default: 0})
    nonce?: number = 0;
}
