import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export class MarketData {
    denom: string;
    price: number;
}

@Entity({ name: 'market' })
export class MarketEntity {
    @PrimaryColumn()
    id: string;

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
