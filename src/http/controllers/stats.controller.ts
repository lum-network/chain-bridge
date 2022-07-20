import {Controller, Get} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";

import {StatService} from "@app/services";

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
}
