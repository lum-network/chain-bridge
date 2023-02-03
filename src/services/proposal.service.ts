import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProposalEntity } from '@app/database';

@Injectable()
export class ProposalService {
    constructor(@InjectRepository(ProposalEntity) private readonly _repository: Repository<ProposalEntity>) {}

    getById = async (id: number): Promise<ProposalEntity> => {
        return await this._repository.findOne({ where: { id } });
    };

    fetch = async (): Promise<ProposalEntity[]> => {
        return this._repository.find({
            order: {
                id: 'DESC',
            },
        });
    };

    createOrUpdateProposal = async (data: Partial<ProposalEntity>) => {
        let proposal = await this.getById(data.id);

        if (!proposal) {
            proposal = new ProposalEntity(data);
            proposal = await this._repository.save(proposal);
            return proposal;
        }

        proposal = await this._repository.save({ ...proposal, ...data });
        return proposal;
    };
}
