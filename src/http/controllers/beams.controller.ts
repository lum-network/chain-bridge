import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ElasticService, LumNetworkService } from '@app/services';

@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _elasticService: ElasticService) {}

    @Get('')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();

        return await lumClt.queryClient.beam.fetch();
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const lumClt = await this._lumNetworkService.getClient();

        return await lumClt.queryClient.beam.get(id);
    }
}
