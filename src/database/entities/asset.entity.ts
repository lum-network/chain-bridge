import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'assets' })
export class AssetEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 32 })
    key: string;

    @Column({ type: 'text', nullable: false })
    value: string;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;

    constructor(data: Partial<AssetEntity>) {
        Object.assign(this, data);
    }
}
