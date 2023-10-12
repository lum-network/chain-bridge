import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';

import { MillionsCampaignEntity } from '@app/database';

@Entity({ name: 'millions_campaign_member' })
export class MillionsCampaignMemberEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 128 })
    campaign_id: string;

    @Column({ type: 'varchar', length: 64 })
    wallet_address: string;

    @ManyToOne(() => MillionsCampaignEntity, (campaign) => campaign.members)
    @JoinColumn({ name: 'campaign_id', referencedColumnName: 'campaign_id' })
    campaign: Relation<MillionsCampaignEntity>;

    @CreateDateColumn()
    created_at: Date = new Date();

    @UpdateDateColumn({ nullable: true })
    updated_at: Date = null;
}
