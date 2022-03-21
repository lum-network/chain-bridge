import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';

import { plainToClass } from 'class-transformer';

import { ValidatorService } from '@app/services';
import { ValidatorResponse } from '@app/http/responses';

@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {
    constructor(private readonly _validatorService: ValidatorService) {}

    @Get('')
    async fetch() {
        return await this._validatorService.fetch();
    }

    @Get(':address')
    async show(@Param('address') address: string) {
        const result = await this._validatorService.get(address);
        return plainToClass(ValidatorResponse, result);
    }
}
