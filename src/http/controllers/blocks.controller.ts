import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToClass} from 'class-transformer';

import {BlockService} from '@app/services';

import {DefaultTake} from "@app/http/decorators";
import {BlockResponse, DataResponse, DataResponseMetadata} from '@app/http/responses';

import {ExplorerRequest} from "@app/utils";

@ApiTags('blocks')
@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
    constructor(private readonly _blockService: BlockService) {
    }

    @ApiOkResponse({status: 200, type: DataResponse})
    @DefaultTake(50)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [blocks, total] = await this._blockService.fetch(request.pagination.skip, request.pagination.limit);
        if (!blocks) {
            throw new NotFoundException('blocks_not_found');
        }

        return plainToClass(DataResponse, {
            result: blocks.map((block) => plainToClass(BlockResponse, block)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: blocks.length,
                items_total: total,
            })
        });
    }

    @ApiOkResponse({type: BlockResponse})
    @Get('latest')
    async latest() {
        const block = await this._blockService.getLatest();
        if (!block) {
            throw new NotFoundException('latest_block_not_found');
        }

        return {
            result: plainToClass(BlockResponse, block)
        };
    }

    @ApiOkResponse({type: BlockResponse})
    @Get(':height')
    async show(@Param('height') height: number) {
        const block = await this._blockService.get(height);
        if (!block) {
            throw new NotFoundException('block_not_found');
        }

        return {
            result: plainToClass(BlockResponse, block)
        };
    }
}
