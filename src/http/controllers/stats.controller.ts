import {Body, Controller, Get, Post} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";

import {StatService} from "@app/services";
import {ChartRequest} from "@app/http/requests";
import {DataResponse} from "@app/http/responses";

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(
        private readonly _statService: StatService,
    ) {
    }

    @Get('kpi')
    async getKpi(): Promise<any> {
        return this._statService.getKpi();
    }

    @Post('chart')
    async getChart(@Body() body: ChartRequest): Promise<DataResponse> {
        const result = await this._statService.getChart(body.type, body.start_at, body.end_at);
        return new DataResponse({
            result,
        });
    }
}
