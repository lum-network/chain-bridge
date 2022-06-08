import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn} from "typeorm";

import {AmountModel} from "@app/database/entities/amount.model";

@Entity({name: "beams"})
export class BeamEntity {
    @PrimaryColumn()
    id: string;

    @Column({type: "varchar", length: 64})
    creator_address: string;

    @Column({type: "integer"})
    status: number;

    @Column({type: "varchar", length: 64})
    claim_address: string;

    @Column({type: "boolean", default: false})
    funds_withdrawn: boolean;

    @Column({type: "boolean", default: false})
    claimed?: boolean;

    @Column({type: "varchar", length: 128, nullable: true})
    cancel_reason?: string;

    @Column({type: "boolean", default: false})
    hide_content?: boolean;

    @Column({type: "varchar", length: 32})
    schema: string;

    @Column({type: "integer", default: 0})
    claim_expires_at_block: number;

    @Column({type: "integer", default: 0})
    closes_at_block: number;

    @Column({type: "json"})
    amount: AmountModel;

    @Column({type: "json"})
    data: string;

    @CreateDateColumn({type: 'date', default: () => "CURRENT_DATE"})
    created_at?: Date = new Date;

    @UpdateDateColumn({type: 'date', default: null})
    updated_at?: Date = null;

    @VersionColumn({type: "integer", default: 0})
    nonce?: number = 0;
}
