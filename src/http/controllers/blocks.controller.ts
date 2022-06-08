import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToClass} from 'class-transformer';

import {BlockService} from '@app/services';

import {DefaultTake} from "@app/http/decorators";
import {BlockResponse} from '@app/http/responses';

import {ExplorerRequest} from "@app/utils";

@ApiTags('blocks')
@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
    constructor(private readonly _blockService: BlockService) {
    }

    @DefaultTake(50)
    @Get('')
    async fetch(@Req() request: ExplorerRequest) {
        const [blocks, total] = await this._blockService.fetch(request.pagination.skip, request.pagination.limit);
        if (!blocks) {
            throw new NotFoundException('blocks_not_found');
        }

        return blocks.map((block) => plainToClass(BlockResponse, block));
    }

    @ApiOkResponse({type: BlockResponse})
    @Get('latest')
    async latest() {
        const block = await this._blockService.getLatest();
        if (!block) {
            throw new NotFoundException('latest_block_not_found');
        }

        return plainToClass(BlockResponse, block);
    }

    @ApiOkResponse({type: BlockResponse})
    @Get(':height')
    async show(@Param('height') height: number) {
        const block = await this._blockService.get(height);
        if (!block) {
            throw new NotFoundException('block_not_found');
        }

        return plainToClass(BlockResponse, block);
    }
}
