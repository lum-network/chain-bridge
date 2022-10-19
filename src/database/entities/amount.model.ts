import { Column } from 'typeorm';

export class AmountModel {
    @Column({ type: 'bigint', nullable: true })
    amount: number;

    @Column({ type: 'varchar', length: 32 })
    denom: string;
}
