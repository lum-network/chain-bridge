import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { GovernanceProposalsVotesEntity } from '@app/database';

@Injectable()
export class GovernanceProposalsVotesService {
    constructor(@Inject('GOVERNANCE_PROPOSALS_VOTES_REPOSITORY') private readonly _repository: Repository<GovernanceProposalsVotesEntity>) {}

    getById = async (proposalId: number): Promise<GovernanceProposalsVotesEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    createOrUpdateVoters = async (voter: string, proposalId: number): Promise<GovernanceProposalsVotesEntity> => {
        let entity = await this.getById(proposalId);

        // If entity does not exists, we create with the new one
        if (!entity) {
            entity = new GovernanceProposalsVotesEntity({
                proposal_id: proposalId,
                voter,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.voter = voter;
            entity.proposal_id = proposalId;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchVotersByProposalId = async (proposalId: string, skip: number, take: number): Promise<[GovernanceProposalsVotesEntity[], number]> => {
        const query = this._repository.createQueryBuilder('governance_proposals_votes').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
