import {Inject, Injectable} from '@nestjs/common';

import {Repository} from "typeorm";

import {ValidatorEntity} from "@app/database";

@Injectable()
export class ValidatorService {
    constructor(
        @Inject('VALIDATOR_REPOSITORY') private readonly _repository: Repository<ValidatorEntity>,
    ) {
    }

    get repository(): Repository<ValidatorEntity> {
        return this._repository;
    }

    getByOperatorAddress = async (operator_address: string): Promise<ValidatorEntity> => {
        return this._repository.findOne({
            where: {
                operator_address
            }
        });
    }

    getByProposerAddress = async (proposer_address: string): Promise<ValidatorEntity> => {
        return this._repository.findOne({
            where: {
                proposer_address
            }
        })
    }

    save = (entity: Partial<ValidatorEntity>): Promise<ValidatorEntity> => {
        return this._repository.save(entity);
    }

    saveBulk = (entities: Partial<ValidatorEntity>[]): Promise<ValidatorEntity[]> => {
        return this._repository.save(entities);
    }

    fetch = async (skip: number, take: number): Promise<[ValidatorEntity[], number]> => {
        const query = this._repository.createQueryBuilder('validators').orderBy('validators.tokens', 'DESC').skip(skip).take(take);
        return query.getManyAndCount();
    };

    fetchAll = async (): Promise<ValidatorEntity[]> => {
        return this._repository.find();
    }

    getUNSAFE = async (address: string): Promise<any> => {
        /*const [validator, delegations] = await Promise.all([
            this._lumNetworkService.client.queryClient.staking.validator(address).catch(() => null),
            this._lumNetworkService.client.queryClient.staking.validatorDelegations(address).catch(() => null),
        ]);

        if (!validator) {
            throw new NotFoundException('validator_not_found');
        }

        if (!delegations) {
            throw new NotFoundException('validator_delegations_not_found');
        }

        const accAddress = convertValAddressToAccAddress(validator.validator.operatorAddress);

        const accountDelegations = await this._lumNetworkService.client.queryClient.staking.delegatorDelegations(accAddress).catch(() => null);

        let selfBonded = 0.0;

        for (const accountDelegation of accountDelegations.delegationResponses) {
            if (accountDelegation.delegation.validatorAddress === validator.validator.operatorAddress) {
                selfBonded = accountDelegation.balance.amount;
            }
        }

        // Merge
        return {
            ...validator.validator,
            address: accAddress,
            selfBonded,
            delegations: delegations.delegationResponses,
            delegationsNextKey: delegations.pagination.nextKey.toString(),
        };*/
        return null;
    };
}
