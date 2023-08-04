import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'market' })
export class MarketEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 32 })
    denom: string;

    @Column({ type: 'float' })
    price: number;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;

    constructor(data: Partial<MarketEntity>) {
        Object.assign(this, data);
    }
}
