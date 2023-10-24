import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsCampaignMemberEntity } from '@app/database';

@Injectable()
export class MillionsCampaignMemberService {
    constructor(@InjectRepository(MillionsCampaignMemberEntity) private readonly _repository: Repository<MillionsCampaignMemberEntity>) {}

    get repository(): Repository<MillionsCampaignMemberEntity> {
        return this._repository;
    }

    getById = async (id: string): Promise<MillionsCampaignMemberEntity | null> => {
        return this._repository.findOne({ where: { id } });
    };

    getByCampaignIdAndWalletAddress = async (campaign_id: string, wallet_address: string): Promise<MillionsCampaignMemberEntity | null> => {
        return this._repository.findOne({ where: { campaign_id, wallet_address } });
    };

    save = async (entity: Omit<MillionsCampaignMemberEntity, 'id' | 'created_at' | 'updated_at'>): Promise<MillionsCampaignMemberEntity> => {
        return this._repository.save(entity);
    };
}
