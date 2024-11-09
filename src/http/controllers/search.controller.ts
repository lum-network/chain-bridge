import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { LumBech32Prefixes } from '@lum-network/sdk-javascript';

import { BlockService, TransactionService } from '@app/services';
import { DataResponse, SearchResponse } from '@app/http/responses';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(
        private readonly _blockService: BlockService,
        private readonly _transactionService: TransactionService,
    ) {}

    @ApiOkResponse({ type: () => SearchResponse })
    @Get(':data')
    @UseInterceptors(CacheInterceptor)
    async search(@Param('data') data: string | number): Promise<DataResponse> {
        let retn;

        // We check the different combinations
        if (/^\d+$/.test(String(data))) {
            retn = { type: 'block', data };
        } else if (String(data).startsWith(LumBech32Prefixes.VAL_ADDR)) {
            retn = { type: 'validator', data };
        } else if (String(data).startsWith(LumBech32Prefixes.ACC_ADDR)) {
            retn = { type: 'account', data };
        } else {
            if (await this._blockService.get(parseInt(String(data), 10))) {
                retn = { type: 'block', data };
            } else if (await this._transactionService.get(String(data))) {
                retn = { type: 'transaction', data };
            } else {
                throw new NotFoundException('data_not_found');
            }
        }

        return {
            result: retn,
        };
    }
}
