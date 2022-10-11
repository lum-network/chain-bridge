import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { ProposalsVotesEntity } from '@app/database';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';
import { LumBech32PrefixValAddr } from '@lum-network/sdk-javascript/build/constants';

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

    createOrUpdateVoters = async (proposalId: number, voterAddress: string | null): Promise<ProposalsVotesEntity> => {
        let entity = await this.getById(proposalId);
        let accountAddress: string = null;
        let operatorAddress: string = null;

        // Based on the voterAddress address we either encode the operator to have the account address
        // Or keep the existing
        if (voterAddress.startsWith(LumBech32PrefixValAddr)) {
            accountAddress = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixAccAddr, LumUtils.Bech32.decode(voterAddress).data);
            operatorAddress = voterAddress;
        } else {
            operatorAddress = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(voterAddress).data);
            accountAddress = voterAddress;
        }

        const compositeId = `${proposalId}:${accountAddress}`;

        // If entity does not exists, we create with the new one
        if (!entity) {
            entity = new ProposalsVotesEntity({
                id: compositeId,
                proposal_id: proposalId,
                voter_address: accountAddress,
                voter_operator_address: operatorAddress,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.id = compositeId;
            entity.proposal_id = proposalId;
            entity.voter_address = accountAddress;
            entity.voter_operator_address = operatorAddress;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchVotersByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalsVotesEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_votes').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
