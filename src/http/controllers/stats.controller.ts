import {Controller, Get} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";

import {plainToClass} from "class-transformer";

import {StatsResponse} from "@app/http/responses";

import {LumNetworkService} from "@app/services";

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(
        private readonly _lumNetworkService: LumNetworkService,
    ) {
    }

    @Get('')
    async stats() {
        const [inflation, totalSupply, chainId] = await Promise.all([
            this._lumNetworkService.client.queryClient.mint.inflation().catch(() => null),
            this._lumNetworkService.client.getAllSupplies().catch(() => null),
            this._lumNetworkService.client.getChainId().catch(() => null),
        ]);

        return {
            result: plainToClass(StatsResponse, {inflation: inflation || '0', totalSupply, chainId})
        };
    }
}
