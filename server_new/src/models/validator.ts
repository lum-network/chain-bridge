import {Table, Column, Model, CreatedAt, DataType, UpdatedAt} from 'sequelize-typescript';

@Table({
    tableName: 'validators',
    underscored: true,
    timestamps: true
})
export default class Validator extends Model<Validator> {
    @Column
    address_consensus: string;

    @Column
    address_consensus_pub: string;

    @Column
    address_operator: string;

    @Column
    address_operator_pub: string;

    @CreatedAt
    @Column({ field: "created_at", type: DataType.DATE })
    created_at: Date

    @UpdatedAt
    @Column({ field: "updated_at", type: DataType.DATE })
    updated_at: Date
}
