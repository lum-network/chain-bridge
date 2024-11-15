import { Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';

import { BlockService } from '@app/services';

import { DefaultTake } from '@app/http/decorators';
import { BlockShowParams } from '@app/http/params';
import { BlockResponse, DataResponse, DataResponseMetadata } from '@app/http/responses';

import { ExplorerRequest } from '@app/utils';

@ApiTags('blocks')
@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
    constructor(private readonly _blockService: BlockService) {}

    @ApiOkResponse({ type: () => [BlockResponse] })
    @DefaultTake(50)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [blocks, total] = await this._blockService.fetch(request.pagination.skip, request.pagination.limit);
        if (!blocks) {
            throw new NotFoundException('blocks_not_found');
        }

        return new DataResponse({
            result: blocks.map((block) => plainToInstance(BlockResponse, block)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: blocks.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: BlockResponse })
    @Get('latest')
    async latest(): Promise<DataResponse> {
        const block = await this._blockService.getLatest();
        if (!block) {
            throw new NotFoundException('latest_block_not_found');
        }

        return {
            result: plainToInstance(BlockResponse, block),
        };
    }

    @ApiOkResponse({ type: BlockResponse })
    @Get(':height')
    async show(@Param() params: BlockShowParams): Promise<DataResponse> {
        const block = await this._blockService.get(params.height);

        if (!block) {
            await this._blockService.failSafeIngest(params.height);
            throw new NotFoundException('block_not_found');
        }

        return {
            result: plainToInstance(BlockResponse, block),
        };
    }
}
