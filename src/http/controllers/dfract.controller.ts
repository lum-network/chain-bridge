import { CacheInterceptor, Controller, Get, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AssetService, ChainService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata, AssetInfo } from '@app/http/responses/';
import { ExplorerRequest } from '@app/utils';

@ApiTags('dfract')
@Controller('dfract')
@UseInterceptors(CacheInterceptor)
export class DfractController {
    constructor(private readonly _assetService: AssetService, private readonly _lumService: LumNetworkService) {}

    @ApiOkResponse({ status: 200, type: AssetInfo })
    @Get('assets/latest')
    async getLatestAsset(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const customOffset = 100;

        const result = await this._assetService.fetchLatestMetrics(request.pagination.skip, customOffset);
        const result2 = await this._lumService.getAssetInfo();

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

    @ApiOkResponse({ status: 200 })
    // example-1: assets/lum_unit_price_usd/nov-2022
    // example-2: assets/akt_apy/nov-2022
    @Get('assets/:metrics/:since')
    async getHistoricalData(@Req() request: ExplorerRequest, @Param('since') since: string, @Param('metrics') id: string): Promise<DataResponse> {
        const customOffset = 100;

        const result = await this._assetService.fetchMetricsSince(id, since, request.pagination.skip, customOffset);

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
