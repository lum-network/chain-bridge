import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn} from "typeorm";
import {AmountModel} from "@app/database/entities/amount.model";

@Entity({name: "transactions"})
export class TransactionEntity {
    @PrimaryColumn({type: "varchar", length: 128})
    hash: string;

    @Column({type: "integer"})
    height: number;

    @Column({type: "timestamp"})
    time: Date;

    @Column({type: "varchar", length: 128})
    proposer_address;

    @Column({type: "varchar", length: 128})
    operator_address: string;

    @Column({type: "integer"})
    block_height: number;

    @Column({type: "varchar", length: 128})
    block_hash: string;

    @Column({type: "boolean"})
    success: boolean;

    @Column({type: "integer"})
    code: number;

    @Column({type: "json"})
    fees: AmountModel[];

    @Column({type: "integer"})
    gas_wanted: number;

    @Column({type: "integer"})
    gas_used: number;

    @Column({type: "json", nullable: true})
    amount?: AmountModel;

    @Column({type: "json", nullable: true})
    auto_claim_reward?: AmountModel;

    @Column({type: "json", default: () => "'[]'"})
    addresses: string[];

    @Column({type: "varchar", length: 256, nullable: true})
    memo?: string;

    @Column({type: "json"})
    messages: { type_url: string; value: any }[];

    @Column({type: "varchar", length: 64})
    message_type: string;

    @Column({type: "integer"})
    messages_count: number;

    @Column({type: "json"})
    raw_logs: any[];

    @Column({type: "json"})
    raw_events: any[];

    @Column({type: "json"})
    raw_tx: string;

    @Column({type: "json"})
    raw_tx_data: string;

    @CreateDateColumn({type: 'date', default: () => "CURRENT_DATE"})
    created_at?: Date = new Date;

    @UpdateDateColumn({type: 'date', default: null})
    updated_at?: Date = null;

    @VersionColumn({type: "integer", default: 0})
    nonce?: number = 0;

    constructor(props?: Partial<TransactionEntity>) {
        Object.assign(this, props);
    }
}
