import {Table, Column, Model, CreatedAt, DataType, UpdatedAt} from 'sequelize-typescript';

@Table({
    tableName: 'sat_migrations',
    underscored: true,
    timestamps: true
})
export default class Migration extends Model<Migration> {
    @Column
    reference: string;

    @Column
    state: 'WAITING'|'ACCEPTED'|'REFUSED';

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

    @Column
    raw_tx: string;

    @CreatedAt
    @Column({ field: "created_at", type: DataType.DATE })
    created_at: Date

    @UpdatedAt
    @Column({ field: "updated_at", type: DataType.DATE })
    updated_at: Date
}
