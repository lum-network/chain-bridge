import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    DefaultScope,
    CreatedAt,
    UpdatedAt,
    DataType
} from 'sequelize-typescript';
import Block from "./block";

@Table({
    tableName: 'transactions',
    underscored: true,
    timestamps: true
})
export default class Transaction extends Model<Transaction> {
    @Column
    height: number;

    @Column
    hash: string;

    @Column
    action: string;

    @ForeignKey(() => Block)
    @Column
    block_id: number;

    @BelongsTo(() => Block)
    block: Block;

    @Column
    code: number;

    @Column
    success: boolean;

    @Column
    log: string;

    @Column
    gas_wanted: number;

    @Column
    gas_used: number;

    @Column
    from_address: string;

    @Column
    to_address: string;

    @Column
    sender_id: number;

    @Column
    recipient_id: number;

    @Column
    name: string;

    @Column
    amount: number;

    @Column
    msgs: string;

    @Column
    raw: string;

    @Column
    dispatched_at: Date

    @CreatedAt
    @Column({ field: "created_at", type: DataType.DATE })
    created_at: Date

    @UpdatedAt
    @Column({ field: "updated_at", type: DataType.DATE })
    updated_at: Date
}
