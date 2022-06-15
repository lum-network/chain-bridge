import {CacheInterceptor, Controller, Get, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from "class-transformer";

import {BeamService} from '@app/services';

import {DefaultTake} from "@app/http/decorators";
import {BeamResponse, DataResponse, DataResponseMetadata} from "@app/http/responses";

import {ExplorerRequest} from "@app/utils";

@ApiTags('beams')
@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _beamService: BeamService) {}

    @ApiOkResponse({status: 200, type: [BeamResponse]})
    @DefaultTake(50)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [beams, totalBeams] = await this._beamService.fetch(request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: beams.map(beam => plainToInstance(BeamResponse, beam)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: beams.length,
                items_total: totalBeams,
            })
        })
    }

    @ApiOkResponse({type: BeamResponse})
    @Get(':id')
    async get(@Param('id') id: string): Promise<DataResponse> {
        const beam = await this._beamService.get(id);
        return {
            result: plainToInstance(BeamResponse, beam)
        };
    }
}
