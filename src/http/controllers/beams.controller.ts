import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToClass} from "class-transformer";

import { LumNetworkService } from '@app/services';
import {BeamResponse} from "@app/http/responses";

@ApiTags('beams')
@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Get('')
    async fetch() {
        return await this._lumNetworkService.client.queryClient.beam.fetch();
    }

    @ApiOkResponse({type: BeamResponse})
    @Get(':id')
    async get(@Param('id') id: string) {
        const beam = await this._lumNetworkService.client.queryClient.beam.get(id);
        return plainToClass(BeamResponse, beam);
    }
}
