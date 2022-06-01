import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';

import {plainToClass} from 'class-transformer';

import {BlockService} from '@app/services';
import {BlockResponse} from '@app/http/responses';
import {ExplorerRequest} from "@app/utils";

@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
    constructor(private readonly _blockService: BlockService) {
    }

    @Get('')
    async fetch(@Req() request: ExplorerRequest) {
        const [blocks, total] = await this._blockService.fetch(request.pagination.skip, request.pagination.limit);
        if (!blocks) {
            throw new NotFoundException('blocks_not_found');
        }

        return blocks.map((block) => plainToClass(BlockResponse, block));
    }

    @Get('latest')
    async latest() {
        const block = await this._blockService.getLatest();
        if (!block) {
            throw new NotFoundException('latest_block_not_found');
        }

        return plainToClass(BlockResponse, block);
    }

    @Get(':height')
    async show(@Param('height') height: number) {
        const block = await this._blockService.get(height);
        if (!block) {
            throw new NotFoundException('block_not_found');
        }

        return plainToClass(BlockResponse, block);
    }
}
