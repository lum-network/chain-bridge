import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MillionsCampaignEntity } from '@app/database';

@Injectable()
export class MillionsCampaignService {
    constructor(@InjectRepository(MillionsCampaignEntity) private readonly _repository: Repository<MillionsCampaignEntity>) {}

    get repository(): Repository<MillionsCampaignEntity> {
        return this._repository;
    }

    getById = async (id: string): Promise<MillionsCampaignEntity> => {
        return this._repository.findOne({ where: { id }, relations: ['members'] });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsCampaignEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_campaigns').leftJoinAndSelect('millions_campaigns.members', 'members').orderBy('millions_campaigns.end_at', 'DESC').skip(skip).take(take);

        query.distinct(true);

        return query.getManyAndCount();
    };
}
