import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { ProposalDepositEntity } from '@app/database';
import { Coin } from '@lum-network/sdk-javascript/build/codec/cosmos/base/v1beta1/coin';

@Injectable()
export class ProposalDepositService {
    constructor(@Inject('PROPOSAL_DEPOSIT_REPOSITORY') private readonly _repository: Repository<ProposalDepositEntity>) {}

    getByProposalId = async (proposalId: number): Promise<ProposalDepositEntity> => {
        return this._repository.findOne({
            where: {
                proposal_id: proposalId,
            },
        });
    };

    getById = async (compositeKey: string): Promise<ProposalDepositEntity> => {
        return this._repository.findOne({
            where: {
                id: compositeKey,
            },
        });
    };

    createOrUpdateDepositors = async (proposalId: number, depositorAddress: string, amount: Coin): Promise<ProposalDepositEntity> => {
        let entity = await this.getByProposalId(proposalId);

        // Composite primary key compose proposalId and accountAddress
        const compositeIdDepositorAddress = `${proposalId}:${depositorAddress}`;

        // If entity does not exists, we create with a new one
        if (!entity) {
            entity = new ProposalDepositEntity({
                id: compositeIdDepositorAddress,
                proposal_id: proposalId,
                depositor_address: depositorAddress,
                amount,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.id = compositeIdDepositorAddress;
            entity.depositor_address = depositorAddress;
            entity.proposal_id = proposalId;
            entity.amount = amount;
        }

        await this._repository.save(entity);
        return entity;
    };

    fetchDepositorsByProposalId = async (proposalId: string, skip: number, take: number): Promise<[ProposalDepositEntity[], number]> => {
        const query = this._repository.createQueryBuilder('proposals_deposits').where('proposal_id = :id', { id: proposalId }).skip(skip).take(take);
        return query.getManyAndCount();
    };
}
