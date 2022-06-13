import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ElasticService, LumNetworkService } from '@app/services';
import { plainToClass } from 'class-transformer';
import { BeamResponse } from '@app/http/responses/beam.response';

@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _elasticService: ElasticService) {}

    @Get('')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();

        const beams = await lumClt.queryClient.beam.fetch();

        return beams.map((beam) => plainToClass(BeamResponse, beam));
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const lumClt = await this._lumNetworkService.getClient();

        const beam = await lumClt.queryClient.beam.get(id);

        return plainToClass(BeamResponse, beam);
    }
}
