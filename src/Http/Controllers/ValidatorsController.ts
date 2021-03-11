import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { plainToClass } from 'class-transformer';

import { LumNetworkService } from '@app/Services';
import { ValidatorResponse } from '@app/Http/Responses';

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export default class ValidatorsController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Get('')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();
        const { validators } = lumClt.queryClient.staking.unverified;

        // We acquire both bounded and unbonded (candidates) validators
        const [bonded, unbonding, unbonded] = await Promise.all([validators('BOND_STATUS_BONDED'), validators('BOND_STATUS_UNBONDING'), validators('BOND_STATUS_UNBONDED')]);

        const results = [...bonded.validators, ...unbonding.validators, ...unbonded.validators];

        return results.map((validator) => plainToClass(ValidatorResponse, validator));
    }

    @Get(':address')
    async show(@Req() req: Request) {
        const lumClt = await this._lumNetworkService.getClient();

        const [validator, delegations, rewards] = await Promise.all([
            lumClt.queryClient.staking.unverified.validator(req.params.address),
            lumClt.queryClient.staking.unverified.validatorDelegations(req.params.address),
            lumClt.queryClient.distribution.unverified.validatorOutstandingRewards(req.params.address),
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

        // Merge
        const result = {
            ...validator.validator,
            delegations,
            rewards,
        };

        return plainToClass(ValidatorResponse, result);
    }
}
