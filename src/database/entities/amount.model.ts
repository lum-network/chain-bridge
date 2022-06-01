import {Column} from "typeorm";

export class AmountModel {
    @Column({type: "integer"})
    amount: number;

    @Column({type: "varchar", length: 32})
    denom: string;
}
