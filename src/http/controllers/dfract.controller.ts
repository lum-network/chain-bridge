import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
    AkashNetworkService,
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
    ) {}

    @ApiOkResponse({ status: 200 })
    @Get('assets/dfract')
    async getDfrInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        /* const tokenInfo = await this._dfract.getTotalComputedTvl(); */
        const accountBalance = await this._dfract.getAccountAvailableBalance();

        console.log('accountBalance', accountBalance);

        return new DataResponse({
            result: accountBalance,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/cosmos')
    async getCosmosInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._cosmosService.getTokenInfo();
        const tvl = await this._cosmosService.getTvl();

        return new DataResponse({
            result: { tokenInfo, tvl },
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/osmosis')
    async getAtomInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._osmosisService.getTokenInfo();
        const tvl = await this._osmosisService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/juno')
    async getJunoInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._junoService.getTokenInfo();
        const tvl = await this._junoService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/evmos')
    async getEvmosInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._evmosService.getTokenInfo();
        const tvl = await this._evmosService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/lum')
    async getLumInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._lumNetworkService.getTokenInfo();
        const tvl = await this._lumNetworkService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/comdex')
    async getCmdxInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._comdexService.getTokenInfo();
        const tvl = await this._comdexService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/stargaze')
    async getStarsInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._stargazeService.getTokenInfo();
        const tvl = await this._stargazeService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/akash')
    async getAkashInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._akashNetworkService.getTokenInfo();
        const tvl = await this._akashNetworkService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/sentinel')
    async getSentinelInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._sentinelService.getTokenInfo();
        const tvl = await this._sentinelService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200 })
    @Get('assets/kichain')
    async getkichainlInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const tokenInfo = await this._kiChainService.getTokenInfo();
        const tvl = await this._kiChainService.getTvl();

        return new DataResponse({
            result: [tokenInfo, tvl],
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_total: null,
            }),
        });
    }
}
