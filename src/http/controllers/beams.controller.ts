import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes } from '@app/utils';

@Controller('beams')
@UseInterceptors(CacheInterceptor)
export class BeamsController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _elasticService: ElasticService) {}

    @Get('')
    async fetch() {
        // We get the 50 last block stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_BEAMS, {
            size: 50,
            sort: { height: 'desc' },
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits) {
            throw new NotFoundException('beams_not_found');
        }

        return result.body.hits.hits.map(beam => beam._source);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const lumClt = await this._lumNetworkService.getClient();

        return await lumClt.queryClient.beam.get(id);
    }
}
