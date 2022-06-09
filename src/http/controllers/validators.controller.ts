import {CacheInterceptor, Controller, Get, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from 'class-transformer';

import { ValidatorService } from '@app/services';
import {DataResponse, DataResponseMetadata, ValidatorResponse} from '@app/http/responses';
import {ExplorerRequest} from "@app/utils";

@ApiTags('validators')
@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {
    constructor(private readonly _validatorService: ValidatorService) {}

    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const validators = await this._validatorService.fetch();
        return new DataResponse({
            result: validators.map((validator) => plainToInstance(ValidatorResponse, validator)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: validators.length,
                items_total: null,
            })
        })
    }

    @ApiOkResponse({status: 200, type: ValidatorResponse})
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        const result = await this._validatorService.get(address);
        return {
            result: plainToInstance(ValidatorResponse, result)
        };
    }
}
