import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ChainService, DfractService, LumNetworkService } from '@app/services';
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
        private readonly _dfract: DfractService,
        private readonly _chainService: ChainService,
        private readonly _dfr: DfractService,
    ) {}

    @ApiOkResponse({ status: 200 })
    @Get('assets/latest')
    async getDfrInfo(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const result = await this._dfr.getTokenInfo();

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
