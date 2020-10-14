import {Controller, Get} from "@nestjs/common";
import {BlockchainService} from "@app/Services";
import {classToPlain} from "class-transformer";
import {ValidatorResponse} from "@app/Http/Responses";

@Controller('validators')
export default class ValidatorsController {

    @Get('')
    async fetch() {
        // We acquire both bounded and unbonded (candidates) validators
        const bonded = await BlockchainService.getInstance().getClient().getValidators('bonded');
        const unbonded = await BlockchainService.getInstance().getClient().getValidators('unbonded');
        const results = [...bonded.result, ...unbonded.result];

        return results.map((validator) => classToPlain(new ValidatorResponse(validator)));
    }
}
