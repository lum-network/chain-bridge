import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { plainToClass } from 'class-transformer';

import {ValidatorService} from '@app/services';
import { BlockResponse, ValidatorResponse } from '@app/http/responses';
import { ElasticIndexes, convertValAddressToAccAddress } from '@app/utils';

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {

    constructor(private readonly _validatorService: ValidatorService) {
    }

    @Get('')
    async fetch() {

    }

    @Get(':address')
    async show(@Param('address') address: string) {
        const blocksPromise = this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
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
        });
        const lumClt = await this._lumNetworkService.getClient();

        const [validator, delegations, rewards, blocksResponse] = await Promise.all([
            lumClt.queryClient.staking.validator(address).catch(() => null),
            lumClt.queryClient.staking.validatorDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.validatorOutstandingRewards(address).catch(() => null),
            blocksPromise.catch(() => null),
        ]);

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

        const accountDelegations = await lumClt.queryClient.staking.delegatorDelegations(accAddress).catch(() => null);

        let selfBonded = 0.0;

        for (const accountDelegation of accountDelegations.delegationResponses) {
            if (accountDelegation.delegation.validatorAddress === validator.validator.operatorAddress) {
                selfBonded = accountDelegation.balance.amount;
            }
        }

        let blocks = [];

        if (blocksResponse && blocksResponse.body && blocksResponse.body.hits && blocksResponse.body.hits.hits) {
            blocks = blocksResponse.body.hits.hits.map((hit) => plainToClass(BlockResponse, hit._source));
        }

        // Merge
        const result = {
            ...validator.validator,
            address: accAddress,
            selfBonded,
            delegations: delegations.delegationResponses,
            delegationsNextKey: delegations.pagination.nextKey.toString(),
            rewards,
            blocks,
        };

        return plainToClass(ValidatorResponse, result);
    }
}
