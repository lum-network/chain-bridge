import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AkashNetworkService, ComdexService, CosmosService, DfractService, EvmosService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata } from '@app/http/responses/';
import { ExplorerRequest } from '@app/utils';

@ApiTags('dfract')
@Controller('dfract')
@UseInterceptors(CacheInterceptor)
export class DfractController {
    constructor(private readonly _dfractService: DfractService, private readonly _dfr: DfractService) {}

    @ApiOkResponse({ status: 200 })
    @Get('assets')
    async getProtocolAssets(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const result = await this._dfr.getTokenInfo();

        return new DataResponse({
            result: result,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }
}
