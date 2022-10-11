import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { ProposalsDepositsEntity } from '@app/database';

@Injectable()
export class ProposalsDepositsService {
    constructor(@Inject('PROPOSALS_DEPOSITS_REPOSITORY') private readonly _repository: Repository<ProposalsDepositsEntity>) {}

    getById = async (proposalId: number): Promise<ProposalsDepositsEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    createOrUpdateDepositors = async (proposalId: number, depositorAddress: string): Promise<ProposalsDepositsEntity> => {
        let entity = await this.getById(proposalId);

        // If entity does not exists, we create with the new one
        if (!entity) {
            entity = new ProposalsDepositsEntity({
                proposal_id: proposalId,
                depositor_address: depositorAddress,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.depositor_address = depositorAddress;
            entity.proposal_id = proposalId;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchDepositorsByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalsDepositsEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_deposits').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
