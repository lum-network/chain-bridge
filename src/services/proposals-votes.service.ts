import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { ProposalsVotesEntity } from '@app/database';

@Injectable()
export class ProposalsVotesService {
    constructor(@Inject('PROPOSALS_VOTES_REPOSITORY') private readonly _repository: Repository<ProposalsVotesEntity>) {}

    getById = async (proposalId: number): Promise<ProposalsVotesEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    createOrUpdateVoters = async (proposalId: number, voterAddress: string | null, voterOperatorAddress: string | null): Promise<ProposalsVotesEntity> => {
        let entity = await this.getById(proposalId);

        // If entity does not exists, we create with the new one
        if (!entity) {
            entity = new ProposalsVotesEntity({
                proposal_id: proposalId,
                voter_address: voterAddress,
                voter_operator_address: voterOperatorAddress,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.proposal_id = proposalId;
            entity.voter_address = voterAddress;
            entity.voter_operator_address = voterOperatorAddress;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchVotersByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalsVotesEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_votes').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
