import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { ElasticService, LumNetworkService } from '@app/Services';
import { BlockResponse, ValidatorResponse } from '@app/Http/Responses';
import { ElasticIndexes } from '@app/Utils/Constants';
import { convertValAddressToAccAddress } from '@app/Utils/Validators';

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export default class ValidatorsController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _elasticService: ElasticService) {}

    @Get('')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();
        const { validators } = lumClt.queryClient.staking.unverified;

        // We acquire both bounded and unbonded (candidates) validators
        const [bonded, unbonding, unbonded] = await Promise.all([validators('BOND_STATUS_BONDED'), validators('BOND_STATUS_UNBONDING'), validators('BOND_STATUS_UNBONDED')]);

        const results = [...bonded.validators, ...unbonding.validators, ...unbonded.validators];

        return results.map(validator => plainToClass(ValidatorResponse, validator));
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
            lumClt.queryClient.staking.unverified.validator(address).catch(() => null),
            lumClt.queryClient.staking.unverified.validatorDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.unverified.validatorOutstandingRewards(address).catch(() => null),
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

        const accountDelegations = await lumClt.queryClient.staking.unverified.delegatorDelegations(accAddress).catch(() => null);

        let selfBonded = 0.0;

        for (const delegation of accountDelegations.delegationResponses) {
            selfBonded += delegation.balance.amount;
        }

        let blocks = [];

        if (blocksResponse && blocksResponse.body && blocksResponse.body.hits && blocksResponse.body.hits.hits) {
            blocks = blocksResponse.body.hits.hits.map(hit => plainToClass(BlockResponse, hit._source));
        }

        // Merge
        const result = {
            ...validator.validator,
            address: accAddress,
            selfBonded,
            delegations: delegations.delegationResponses,
            rewards,
            blocks,
        };

        return plainToClass(ValidatorResponse, result);
    }
}
