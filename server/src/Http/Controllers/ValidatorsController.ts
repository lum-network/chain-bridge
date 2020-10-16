import {CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors} from "@nestjs/common";
import {Request} from "express";
import {classToPlain} from "class-transformer";

import {BlockchainService} from "@app/Services";
import {ValidatorResponse} from "@app/Http/Responses";

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export default class ValidatorsController {

    @Get('')
    async fetch() {
        // We acquire both bounded and unbonded (candidates) validators
        const bonded = await BlockchainService.getInstance().getClient().getValidators('bonded');
        const unbonded = await BlockchainService.getInstance().getClient().getValidators('unbonded');
        const results = [...bonded.result, ...unbonded.result];

        return results.map((validator) => classToPlain(new ValidatorResponse(validator)));
    }

    @Get(':address')
    async show(@Req() req: Request){
        // Acquire the validator
        const validator = await BlockchainService.getInstance().getClient().getValidator(req.params.address);
        if(!validator){
            throw new NotFoundException('validator_not_found');
        }

        // Acquire the delegations list
        const delegations = await BlockchainService.getInstance().getClient().getValidatorDelegations(req.params.address);
        if(!delegations){
            throw new NotFoundException('validator_delegations_not_found');
        }
        validator.result.delegations = delegations.result;

        // Acquire the rewards
        const rewards = await BlockchainService.getInstance().getClient().getValidatorOutstandingRewards(req.params.address);
        if(!rewards){
            throw new NotFoundException('validator_rewards_not_found');
        }
        validator.result.rewards = rewards.result;

        return classToPlain(new ValidatorResponse(validator.result));
    }
}
