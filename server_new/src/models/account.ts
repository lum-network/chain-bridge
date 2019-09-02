import {Table, Column, Model, CreatedAt, DataType, UpdatedAt, HasMany} from 'sequelize-typescript';
import Transaction from "./transaction";

@Table({
    tableName: 'accounts',
    underscored: true,
    timestamps: true
})
export default class Account extends Model<Account> {
    @Column
    address: string;

    @Column
    coins: string;

    @Column
    public_key_type: string;

    @Column
    public_key_value: string;

    @Column
    account_number: number;

    @Column
    sequence: number;

    @CreatedAt
    @Column({ field: "created_at", type: DataType.DATE })
    created_at: Date

    @UpdatedAt
    @Column({ field: "updated_at", type: DataType.DATE })
    updated_at: Date

    @HasMany(() => Transaction, 'sender_id')
    transactions_sent: Transaction[];

    @HasMany(() => Transaction, 'recipient_id')
    transactions_received: Transaction[];
}
