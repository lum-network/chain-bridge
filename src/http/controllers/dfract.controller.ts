import { Body, CacheInterceptor, Controller, Get, Param, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AssetService } from '@app/services';
import { AssetInfoResponse, AssetHistoricalResponse, DataResponse, DataResponseMetadata } from '@app/http/responses';
import { ExplorerRequest } from '@app/utils';
import { AssetDenomParams, AssetRequest } from '@app/http/requests';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('dfract')
@Controller('dfract')
@UseInterceptors(CacheInterceptor)
export class DfractController {
    constructor(private readonly _assetService: AssetService) {}

    @ApiOkResponse({ status: 200, type: AssetInfoResponse })
    @DefaultTake(100)
    @Get('assets/latest')
    async getLatestAsset(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [result, total] = await this._assetService.fetchLatestMetrics(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: result.map((el) => plainToInstance(AssetInfoResponse, el)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: result.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: AssetHistoricalResponse })
    @Post('assets/since')
    async getHistoricalData(@Body() body: AssetRequest): Promise<DataResponse> {
        const result = await this._assetService.fetchMetricsSince(body.metrics, body.since);

        return new DataResponse({
            result,
        });
    }

    @ApiOkResponse({ status: 200, type: AssetInfoResponse })
    @Get('assets/:denom')
    async getAssetsByDenom(@Param() denomParams: AssetDenomParams): Promise<DataResponse> {
        const result = await this._assetService.fetchLatestAsset(denomParams.denom);

        return new DataResponse({
            result,
        });
    }
}
