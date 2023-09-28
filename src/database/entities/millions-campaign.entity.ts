import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'millions_campaign' })
export class MillionsCampaignEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 128 })
    name: string;

    @Column({ type: 'varchar', length: 1024 })
    description: string;

    @Column({ type: 'date', default: null, nullable: true })
    start_at?: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    end_at?: Date = null;

    @Column({ type: 'varchar', length: 64 })
    password: string;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;
}
