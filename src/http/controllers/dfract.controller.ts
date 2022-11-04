import { Body, CacheInterceptor, Controller, Get, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AssetService } from '@app/services';
import { DataResponse, DataResponseMetadata, AssetInfo, AssetHistorical } from '@app/http/responses/';
import { ExplorerRequest } from '@app/utils';
import { AssetRequest } from '../requests/asset.request';

@ApiTags('dfract')
@Controller('dfract')
@UseInterceptors(CacheInterceptor)
export class DfractController {
    constructor(private readonly _assetService: AssetService) {}

    @ApiOkResponse({ status: 200, type: AssetInfo })
    @Get('assets/latest')
    async getLatestAsset(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [result, total] = await this._assetService.fetchLatestMetrics(request.pagination.skip);

        return new DataResponse({
            result: result,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: result.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: AssetHistorical })
    // example-1: assets/lum_unit_price_usd/nov-2022
    // example-2: assets/akt_apy/oct-2022
    @Post('assets/since')
    async getHistoricalData(@Body() body: AssetRequest): Promise<DataResponse> {
        const result = await this._assetService.fetchMetricsSince(body.metrics, new Date(body.since));

        return new DataResponse({
            result,
        });
    }
}
