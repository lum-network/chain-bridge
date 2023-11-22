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
        return this._repository.findOne({ where: { id } });
    };

    fetch = async (skip: number, take: number): Promise<[MillionsCampaignEntity[], number]> => {
        const query = this._repository.createQueryBuilder('millions_campaigns').orderBy('millions_campaigns.end_at', 'DESC').skip(skip).take(take);

        return query.getManyAndCount();
    };
}