import {Inject, Injectable, NotFoundException} from '@nestjs/common';

import {LumUtils} from '@lum-network/sdk-javascript';
import {Repository} from "typeorm";

import {convertValAddressToAccAddress} from '@app/utils';

import {LumNetworkService} from '@app/services/lum-network.service';
import {ValidatorEntity} from "@app/database";

@Injectable()
export class ValidatorService {
    constructor(
        @Inject('VALIDATOR_REPOSITORY') private readonly _repository: Repository<ValidatorEntity>,
        private readonly _lumNetworkService: LumNetworkService) {
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

    get = async (address: string): Promise<any> => {
        const [validator, delegations, rewards/*, blocksResponse*/] = await Promise.all([
            this._lumNetworkService.client.queryClient.staking.validator(address).catch(() => null),
            this._lumNetworkService.client.queryClient.staking.validatorDelegations(address).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.validatorOutstandingRewards(address).catch(() => null),
            // blocksPromise.catch(() => null),
        ]);

        console.log(validator);

        if (!validator) {
            throw new NotFoundException('validator_not_found');
        }

        if (!delegations) {
            throw new NotFoundException('validator_delegations_not_found');
        }

        if (!rewards) {
            throw new NotFoundException('validator_rewards_not_found');
        }

        const accAddress = convertValAddressToAccAddress(validator.validator.operatorAddress);

        const accountDelegations = await this._lumNetworkService.client.queryClient.staking.delegatorDelegations(accAddress).catch(() => null);

        let selfBonded = 0.0;

        for (const accountDelegation of accountDelegations.delegationResponses) {
            if (accountDelegation.delegation.validatorAddress === validator.validator.operatorAddress) {
                selfBonded = accountDelegation.balance.amount;
            }
        }

        const blocks = [];

        /*if (blocksResponse && blocksResponse.body && blocksResponse.body.hits && blocksResponse.body.hits.hits) {
            blocks = blocksResponse.body.hits.hits.map((hit) => plainToInstance(BlockResponse, hit._source));
        }*/

        // Merge
        return {
            ...validator.validator,
            address: accAddress,
            selfBonded,
            delegations: delegations.delegationResponses,
            delegationsNextKey: delegations.pagination.nextKey.toString(),
            rewards,
            blocks,
        };
    };
}
