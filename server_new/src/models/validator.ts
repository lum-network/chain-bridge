import {Table, Column, Model, DefaultScope} from 'sequelize-typescript';

@DefaultScope(() => ({attributes: {exclude: ['id']}}))
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
}
