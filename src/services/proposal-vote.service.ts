import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { fromBech32, LumBech32Prefixes, toBech32 } from '@lum-network/sdk-javascript';
import { Repository } from 'typeorm';

import { ProposalVoteEntity } from '@app/database';

@Injectable()
export class ProposalVoteService {
    constructor(@InjectRepository(ProposalVoteEntity) private readonly _repository: Repository<ProposalVoteEntity>) {}

    getByProposalId = async (proposalId: number): Promise<ProposalVoteEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    getById = async (compositeKey: string): Promise<ProposalVoteEntity> => {
        return this._repository.findOne({
            where: {
                id: compositeKey,
            },
        });
    };

    createOrUpdateVoters = async (proposalId: number, voterAddress: string, voteOption: number, voteWeight: number): Promise<ProposalVoteEntity> => {
        let entity = await this.getByProposalId(proposalId);

        // Initialize accountAddress and operatorAddress
        let accountAddress: string = null;
        let operatorAddress: string = null;

        // Verify if the voterAddress is an operator
        const isAddressOperator: boolean = voterAddress.startsWith(LumBech32Prefixes.VAL_ADDR);

        // Based on the voterAddress address we either encode the operator to have the account address
        // Or we encode the operatorAddress to get the account one
        if (isAddressOperator) {
            accountAddress = toBech32(LumBech32Prefixes.ACC_ADDR, fromBech32(voterAddress).data);
            operatorAddress = voterAddress;
        } else {
            operatorAddress = toBech32(LumBech32Prefixes.VAL_ADDR, fromBech32(voterAddress).data);
            accountAddress = voterAddress;
        }

        // Composite primary key composed proposalId and accountAddress
        const compositeIdVoterAddress = `${proposalId}:${accountAddress}`;

        // If entity does not exists, we create a new one for ProposalVoteEntity
        if (!entity) {
            entity = new ProposalVoteEntity({
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

    fetchVotersByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalVoteEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_votes').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
