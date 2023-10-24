import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';

import { AmountModel } from '@app/database/entities/amount.model';
import { MillionsCampaignMemberEntity } from '@app/database/entities/millions-campaign-member.entity';

@Entity({ name: 'millions_campaign' })
export class MillionsCampaignEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 128 })
    name: string;

    @Column({ type: 'varchar', length: 1024 })
    description: string;

    @Column({ type: 'varchar', length: 64 })
    username: string;

    @Column({ type: 'varchar', length: 512 })
    image: string;

    @Column({ type: 'integer' })
    drops: number;

    @Column({ type: 'json', nullable: true })
    amount?: AmountModel;

    @Column({ type: 'date', default: null, nullable: true })
    start_at: Date = null;

    @Column({ type: 'date', default: null, nullable: true })
    end_at: Date = null;

    @Column({ type: 'varchar', length: 64 })
    password: string;

    @OneToMany(() => MillionsCampaignMemberEntity, (member) => member.campaign)
    members: Relation<MillionsCampaignMemberEntity>[];

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;
}
