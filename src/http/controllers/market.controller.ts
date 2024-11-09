import { Body, Controller, Get, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';

import { MarketService } from '@app/services';
import { DataResponse, DataResponseMetadata, MarketResponse } from '@app/http/responses';
import { ExplorerRequest } from '@app/utils';
import { MarketRequest } from '@app/http/requests';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('market')
@Controller('market')
@UseInterceptors(CacheInterceptor)
export class MarketController {
    constructor(private readonly _marketService: MarketService) {}

    @ApiOkResponse({ type: () =>MarketResponse })
    @DefaultTake(50)
    @Get('data')
    async getAllMarketData(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [result, total] = await this._marketService.fetchAllMarketData(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: result.map((el) => plainToInstance(MarketResponse, el)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: result.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: () =>MarketResponse })
    @DefaultTake(50)
    @Post('data/since')
    async getHistoricalMarketData(@Req() request: ExplorerRequest, @Body() body: MarketRequest): Promise<DataResponse> {
        const [result, total] = await this._marketService.fetchMarketDataSinceDate(request.pagination.skip, request.pagination.limit, body.since);

        return new DataResponse({
            result: result.map((el) => plainToInstance(MarketResponse, el)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: result.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: () =>MarketResponse })
    @Get('data/latest')
    async getLatestMarketData(): Promise<DataResponse> {
        const result = await this._marketService.fetchLatestMarketData();

        return new DataResponse({
            result,
        });
    }
}
