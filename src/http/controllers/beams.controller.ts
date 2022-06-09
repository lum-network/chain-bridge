import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from "class-transformer";

import { LumNetworkService } from '@app/services';
import {BeamResponse, DataResponse} from "@app/http/responses";

@ApiTags('beams')
@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Get('')
    async fetch() {
        const beams = await this._lumNetworkService.client.queryClient.beam.fetch();
        return beams;
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
