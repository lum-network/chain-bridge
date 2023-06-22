import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AmountModel } from '@app/database/entities/amount.model';

@Entity({ name: 'millions_deposits' })
export class MillionsDepositEntity {
    @PrimaryColumn({ type: 'varchar', length: 32 })
    id: string;

    @Column({ type: 'integer' })
    pool_id: number;

    @Column({ type: 'integer' })
    deposit_id: number;

    @Column({ type: 'integer' })
    withdrawal_id: number;

    @Column({ type: 'varchar', length: 128 })
    depositor_address: string;

    @Column({ type: 'varchar', length: 128 })
    winner_address: string;

    @Column({ type: 'boolean' })
    is_sponsor: boolean;

    @Column({ type: 'integer' })
    block_height: number;

    @Column({ type: 'jsonb' })
    amount: AmountModel;
}
