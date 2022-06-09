import {Controller, Get} from "@nestjs/common";
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToInstance} from "class-transformer";

import {DataResponse, StatsResponse} from "@app/http/responses";

import {LumNetworkService} from "@app/services";

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(
        private readonly _lumNetworkService: LumNetworkService,
    ) {
    }

    @ApiOkResponse({status: 200, type: StatsResponse})
    @Get('')
    async stats(): Promise<DataResponse> {
        const [inflation, totalSupply, chainId] = await Promise.all([
            this._lumNetworkService.client.queryClient.mint.inflation().catch(() => null),
            this._lumNetworkService.client.getAllSupplies().catch(() => null),
            this._lumNetworkService.client.getChainId().catch(() => null),
        ]);

        return {
            result: plainToInstance(StatsResponse, {inflation: inflation || '0', totalSupply, chainId})
        };
    }
}
