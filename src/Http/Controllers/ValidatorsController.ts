import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { plainToClass } from 'class-transformer';

import { LumNetworkService } from '@app/Services';
import { ValidatorResponse } from '@app/Http/Responses';

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export default class ValidatorsController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {
    }

    @Get('')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();

        // We acquire both bounded and unbonded (candidates) validators
        const bonded = await lumClt.queryClient.staking.unverified.validators('BOND_STATUS_BONDED');
        const unbonding = await lumClt.queryClient.staking.unverified.validators('BOND_STATUS_UNBONDING')
        const unbonded = await lumClt.queryClient.staking.unverified.validators('BOND_STATUS_UNBONDED');

        const results = [...bonded.validators, ...unbonding.validators, ...unbonded.validators];

        console.log(results);

        return results.map(validator => plainToClass(ValidatorResponse, validator));
    }

    @Get(':address')
    async show(@Req() req: Request) {
        const lumClt = await this._lumNetworkService.getClient();

        // Acquire the validator
        const validator = await lumClt.queryClient.staking.unverified.validator(req.params.address);

        if (!validator) {
            throw new NotFoundException('validator_not_found');
        }

        // Acquire the delegations list
        const delegations = await lumClt.queryClient.staking.unverified.validatorDelegations(req.params.address);

        if (!delegations) {
            throw new NotFoundException('validator_delegations_not_found');
        }

        // Acquire the rewards
        const rewards = await lumClt.queryClient.distribution.unverified.validatorOutstandingRewards(req.params.address)

        if (!rewards) {
            throw new NotFoundException('validator_rewards_not_found');
        }

        // Merge
        const result = {
            ...validator.validator,
            delegations,
            rewards,
        }

        return plainToClass(ValidatorResponse, result);
    }
}
