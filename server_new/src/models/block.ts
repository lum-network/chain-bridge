import {Table, Column, Model, HasMany, DefaultScope} from 'sequelize-typescript';
import Transaction from "./transaction";

@Table({
    tableName: 'blocks',
    underscored: true,
    timestamps: true
})
export default class Block extends Model<Block> {
    @Column
    chain_id: string;

    @Column
    hash: string;

    @Column
    height: number;

    @Column
    dispatched_at: Date;

    @Column
    num_txs: number;

    @Column
    total_txs: number;

    @Column
    proposer_address: string;

    @Column
    raw: string;

    @HasMany(() => Transaction)
    transactions: Transaction[];
}
