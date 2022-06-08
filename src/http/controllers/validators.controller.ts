import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import { plainToClass } from 'class-transformer';

import { ValidatorService } from '@app/services';
import { ValidatorResponse } from '@app/http/responses';

@ApiTags('validators')
@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {
    constructor(private readonly _validatorService: ValidatorService) {}

    @Get('')
    async fetch() {
        return await this._validatorService.fetch();
    }

    @ApiOkResponse({status: 200, type: ValidatorResponse})
    @Get(':address')
    async show(@Param('address') address: string) {
        const result = await this._validatorService.get(address);
        return plainToClass(ValidatorResponse, result);
    }
}
