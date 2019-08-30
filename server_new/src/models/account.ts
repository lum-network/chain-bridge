import {Table, Column, Model, CreatedAt, DataType, UpdatedAt} from 'sequelize-typescript';

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
}
