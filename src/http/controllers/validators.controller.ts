import {CacheInterceptor, Controller, Get, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from 'class-transformer';

import { ValidatorService } from '@app/services';
import {DefaultTake} from "@app/http/decorators";
import {DataResponse, DataResponseMetadata, ValidatorResponse} from '@app/http/responses';
import {ExplorerRequest} from "@app/utils";

@ApiTags('validators')
@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {
    constructor(private readonly _validatorService: ValidatorService) {}

    @ApiOkResponse({status: 200, type: [ValidatorResponse]})
    @DefaultTake(100)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [validators, total] = await this._validatorService.fetch(request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: validators.map((validator) => plainToInstance(ValidatorResponse, validator)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: validators.length,
                items_total: total,
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
