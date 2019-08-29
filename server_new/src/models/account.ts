import {Table, Column, Model, DefaultScope} from 'sequelize-typescript';

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
}
