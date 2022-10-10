import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { GovernanceProposalsDepositsEntity } from '@app/database';

@Injectable()
export class GovernanceProposalsDepositsService {
    constructor(@Inject('GOVERNANCE_PROPOSALS_DEPOSITS_REPOSITORY') private readonly _repository: Repository<GovernanceProposalsDepositsEntity>) {}

    getById = async (proposalId: number): Promise<GovernanceProposalsDepositsEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    createOrUpdateDepositors = async (depositor: string, proposalId: number): Promise<GovernanceProposalsDepositsEntity> => {
        let entity = await this.getById(proposalId);

        // If entity does not exists, we create with the new one
        if (!entity) {
            entity = new GovernanceProposalsDepositsEntity({
                proposal_id: proposalId,
                depositor,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.depositor = depositor;
            entity.proposal_id = proposalId;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchDepositorsByProposalId = async (proposalId: string, skip: number, take: number): Promise<[GovernanceProposalsDepositsEntity[], number]> => {
        const query = this._repository.createQueryBuilder('governance_proposals_deposits').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
