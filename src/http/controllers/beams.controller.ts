import {CacheInterceptor, Controller, Get, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from "class-transformer";

import { LumNetworkService } from '@app/services';
import {BeamResponse, DataResponse, DataResponseMetadata} from "@app/http/responses";
import {ExplorerRequest} from "@app/utils";

@ApiTags('beams')
@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @ApiOkResponse({status: 200, type: [BeamResponse]})
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const beams = await this._lumNetworkService.client.queryClient.beam.fetch();
        return new DataResponse({
            result: beams.map(beam => plainToInstance(BeamResponse, beam)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: beams.length,
                items_total: null,
            })
        })
    }

    @ApiOkResponse({type: BeamResponse})
    @Get(':id')
    async get(@Param('id') id: string): Promise<DataResponse> {
        const beam = await this._lumNetworkService.client.queryClient.beam.get(id);
        return {
            result: plainToInstance(BeamResponse, beam)
        };
    }
}
