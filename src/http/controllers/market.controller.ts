import { Body, Controller, Get, Param, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';

import { MarketService } from '@app/services';
import { DataResponse, DataResponseMetadata, MarketResponse } from '@app/http/responses';
import { ExplorerRequest } from '@app/utils';
import { MarketDenomParams, MarketRequest } from '@app/http/requests';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('market')
@Controller('market')
@UseInterceptors(CacheInterceptor)
export class MarketController {
    constructor(private readonly _marketService: MarketService) {}

    @ApiOkResponse({ status: 200, type: MarketResponse })
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

    @ApiOkResponse({ status: 200, type: MarketResponse })
    @DefaultTake(50)
    @Post('data/since')
    async getHistoricalMarketDataByDenom(@Req() request: ExplorerRequest, @Body() body: MarketRequest): Promise<DataResponse> {
        const [result, total] = await this._marketService.fetchMarketDataSinceDate(request.pagination.skip, request.pagination.limit, body.denom, body.since);

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

    @ApiOkResponse({ status: 200, type: MarketResponse })
    @Get('data/latest/:denom')
    async getLatestMarketDataByDenom(@Param() denomParams: MarketDenomParams): Promise<DataResponse> {
        const result = await this._marketService.fetchLatestMarketDataByDenom(denomParams.denom);

        return new DataResponse({
            result,
        });
    }
}
