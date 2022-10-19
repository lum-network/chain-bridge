import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ValidatorDelegationEntity } from '@app/database/entities';
import { AmountModel } from '@app/database/entities/amount.model';

@Injectable()
export class ValidatorDelegationService {
    constructor(@InjectRepository(ValidatorDelegationEntity) private readonly _repository: Repository<ValidatorDelegationEntity>) {}

    getById = async (delegatorAddress: string, validatorAddress: string): Promise<ValidatorDelegationEntity> => {
        return this._repository.findOne({
            where: {
                delegator_address: delegatorAddress,
                validator_address: validatorAddress,
            },
        });
    };

    fetchByValidatorAddress = async (validatorAddress: string, skip: number, take: number): Promise<[ValidatorDelegationEntity[], number]> => {
        const query = this._repository.createQueryBuilder('validator_delegations').where('validator_address = :address', { address: validatorAddress }).skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchByDelegatorAddress = async (delegatorAddress: string, skip: number, take: number): Promise<[ValidatorDelegationEntity[], number]> => {
        const query = this._repository.createQueryBuilder('validator_delegations').where('delegator_address = :address', { address: delegatorAddress }).skip(skip).take(take);
        return query.getManyAndCount();
    };

    sumTotalSharesForDelegator = async (delegatorAddress: string): Promise<AmountModel> => {
        const query = this._repository.createQueryBuilder('validator_delegations').select('SUM(shares)', 'total_shares').where('delegator_address = :address', { address: delegatorAddress });
        return query.getRawOne();
    };

    createOrUpdate = async (delegatorAddress: string, validatorAddress: string, shares: number, balance: AmountModel): Promise<ValidatorDelegationEntity> => {
        let entity = await this.getById(delegatorAddress, validatorAddress);

        // If entity does not exists, we create with the values
        if (!entity) {
            entity = new ValidatorDelegationEntity({
                validator_address: validatorAddress,
                delegator_address: delegatorAddress,
                shares: shares,
                balance: balance,
            });
        } else {
            // Otherwise, we just update the properties
            entity.shares = shares;
            entity.balance = balance;
        }

        await this._repository.save(entity);
        return entity;
    };
}
