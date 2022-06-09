import {Inject, Injectable, NotFoundException} from '@nestjs/common';

import {LumUtils} from '@lum-network/sdk-javascript';
import {Repository} from "typeorm";

import {convertValAddressToAccAddress, POST_FORK_HEIGHT} from '@app/utils';

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

    fetch = async (): Promise<any[]> => {
        const {validators} = this._lumNetworkService.client.queryClient.staking;

        // We acquire both bounded and unbonded (candidates) validators
        const [bonded, unbonding, unbonded, tmValidators] = await Promise.all([
            validators('BOND_STATUS_BONDED'),
            validators('BOND_STATUS_UNBONDING'),
            validators('BOND_STATUS_UNBONDED'),
            this._lumNetworkService.client.tmClient.validatorsAll(POST_FORK_HEIGHT),
        ]);

        let allBondedValidators = bonded.validators;

        while (bonded.pagination && bonded.pagination.nextKey && bonded.pagination.nextKey.length) {
            const newPage = await validators('BOND_STATUS_BONDED', bonded.pagination.nextKey);
            allBondedValidators = [...allBondedValidators, ...newPage.validators];
        }

        const results = [...allBondedValidators, ...unbonding.validators, ...unbonded.validators];

        // Get the operator addresses
        const operatorAddresses: string[] = [];

        for (const tmValidator of tmValidators.validators) {
            try {
                const validatorDoc = await this.getByOperatorAddress(LumUtils.toHex(tmValidator.address).toUpperCase());

                operatorAddresses.push(validatorDoc && validatorDoc.operator_address);
            } catch (e) {
            }
        }

        for (const [key, validator] of Object.entries(results)) {
            const genesis = operatorAddresses.find((value) => value === (validator as any).operator_address);

            if (genesis) {
                results[key].genesis = true;
            }
        }
        return results;
    };

    get = async (address: string): Promise<any> => {
        /*const blocksPromise = this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 5,
            sort: { time: 'desc' },
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: address,
                                fields: ['operator_address'],
                                type: 'cross_fields',
                                operator: 'OR',
                            },
                        },
                    ],
                },
            },
        });*/
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
