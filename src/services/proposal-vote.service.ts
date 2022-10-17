import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { ProposalsVotesEntity } from '@app/database';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';
import { LumBech32PrefixValAddr } from '@lum-network/sdk-javascript/build/constants';

@Injectable()
export class ProposalVoteService {
    constructor(@Inject('PROPOSAL_VOTE_REPOSITORY') private readonly _repository: Repository<ProposalsVotesEntity>) {}

    getByProposalId = async (proposalId: number): Promise<ProposalsVotesEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    createOrUpdateVoters = async (proposalId: number, voterAddress: string, voteOption: number, voteWeight: string): Promise<ProposalsVotesEntity> => {
        let entity = await this.getByProposalId(proposalId);

        // Initialize accountAddress and operatorAddress
        let accountAddress: string = null;
        let operatorAddress: string = null;

        // Verify if the voterAddress is an operator
        const isAddressOperator: boolean = voterAddress.startsWith(LumBech32PrefixValAddr);

        // Based on the voterAddress address we either encode the operator to have the account address
        // Or we encode the operatorAddress to get the account one
        if (isAddressOperator) {
            accountAddress = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixAccAddr, LumUtils.Bech32.decode(voterAddress).data);
            operatorAddress = voterAddress;
        } else {
            operatorAddress = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(voterAddress).data);
            accountAddress = voterAddress;
        }

        // Composite primary key composed proposalId and accountAddress
        const compositeIdVoterAddress = `${proposalId}:${accountAddress}`;

        // If entity does not exists, we create a new one for ProposalsVotesEntity
        if (!entity) {
            entity = new ProposalsVotesEntity({
                id: compositeIdVoterAddress,
                proposal_id: proposalId,
                voter_address: accountAddress,
                voter_operator_address: operatorAddress,
                vote_option: voteOption,
                vote_weight: voteWeight,
            });
        } else {
            // Otherwise, we just update the properties
            entity.id = compositeIdVoterAddress;
            entity.proposal_id = proposalId;
            entity.voter_address = accountAddress;
            entity.voter_operator_address = operatorAddress;
            entity.vote_option = voteOption;
            entity.vote_weight = voteWeight;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchVotersByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalsVotesEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_votes').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
