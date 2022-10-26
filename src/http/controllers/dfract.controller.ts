import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
    AkashNetworkService,
    ChainService,
    ComdexService,
    CosmosService,
    DfractService,
    EvmosService,
    JunoService,
    KichainService,
    LumNetworkService,
    OsmosisService,
    SentinelService,
    StargazeService,
} from '@app/services';
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
        private readonly _osmosisService: OsmosisService,
        private readonly _cosmosService: CosmosService,
        private readonly _junoService: JunoService,
        private readonly _evmosService: EvmosService,
        private readonly _comdexService: ComdexService,
        private readonly _stargazeService: StargazeService,
        private readonly _akashNetworkService: AkashNetworkService,
        private readonly _sentinelService: SentinelService,
        private readonly _kiChainService: KichainService,
        private readonly _dfract: DfractService,
        private readonly _chainService: ChainService,
    ) {}

    @ApiOkResponse({ status: 200 })
    @Get('assets/latest')
    async getDfrInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const result = await this._chainService.getTokenSupply();

        console.log('result', result);

        return new DataResponse({
            result: result,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }
}
