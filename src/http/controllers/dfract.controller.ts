import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AssetService, ChainService, DfractService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata } from '@app/http/responses/';
import { ExplorerRequest } from '@app/utils';
import { ConfigService } from '@nestjs/config';

@ApiTags('dfract')
@Controller('dfract')
@UseInterceptors(CacheInterceptor)
export class DfractController {
    constructor(
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _dfract: DfractService,
        private readonly _chainService: ChainService,
        private readonly _dfr: DfractService,
        private readonly _assetService: AssetService,
    ) {}

    @ApiOkResponse({ status: 200 })
    @Get('assets/latest')
    async getDfrInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const customOffset = 100;

        const result = await this._assetService.fetchLatestAssetMetrics(request.pagination.skip, customOffset);

        return new DataResponse({
            result: result,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: customOffset,
                items_count: result.length,
                items_total: result.length,
            }),
        });
    }
}
