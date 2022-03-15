import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { plainToClass } from 'class-transformer';

import { BlockService } from '@app/services';
import { BlockResponse } from '@app/http/responses';

@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
    constructor(private readonly _blockService: BlockService) {}

    @Get('')
    async fetch() {
        const blocks = await this._blockService.fetch();
        if (!blocks) {
            throw new NotFoundException('blocks_not_found');
        }

        return blocks.map((block) => plainToClass(BlockResponse, block._source));
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
