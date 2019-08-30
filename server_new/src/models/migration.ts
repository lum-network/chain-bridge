import {Table, Column, Model} from 'sequelize-typescript';

@Table({
    tableName: 'sat_migrations',
    underscored: true,
    timestamps: true
})
export default class Migration extends Model<Migration> {
    @Column
    reference: string;

    @Column
    state: string;

    @Column
    message: string;

    @Column
    from_address: string;

    @Column
    to_address: string;

    @Column
    tx_hash: string;

    @Column
    amount: string;
}
