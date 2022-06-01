import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "blocks"})
export class BlockEntity {
    @PrimaryColumn({type: "integer"})
    height: number;

    @Column({type: "varchar", length: 256})
    hash: string;

    @Column({type: "timestamp"})
    time: Date;

    @Column({type: "integer", default: 0})
    tx_count: number = 0;

    @Column({type: "jsonb", default: () => "'[]'", array: false})
    tx_hashes: string[] = [];

    @Column({type: "varchar", length: 128})
    proposer_address: string;

    @Column({type: "varchar", length: 128})
    operator_address: string;

    @Column({type: "json"})
    raw_block: string;

    constructor(props?: Partial<BlockEntity>) {
        Object.assign(this, props);
    }
}
