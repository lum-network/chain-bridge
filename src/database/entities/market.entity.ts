import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'market_data' })
export class MarketData {
    @Column({ type: 'varchar', length: 32 })
    denom: string;

    @Column({ type: 'float' })
    price: number;
}

@Entity({ name: 'market' })
export class MarketEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
    market_data: MarketData[] = [];

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;

    constructor(data: Partial<MarketEntity>) {
        Object.assign(this, data);
    }
}
