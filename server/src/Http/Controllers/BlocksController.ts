import {
    CacheInterceptor,
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Req,
    UseInterceptors
} from "@nestjs/common";
import {Request} from "express";
import {ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";
import {classToPlain} from "class-transformer";
import {BlockResponse} from "@app/Http/Responses";

@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export default class BlocksController {
    @Get('')
    async fetch() {
        // We get the 50 last block stored in ES
        const result = await ElasticService.getInstance().documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 50,
            sort: {"height": "desc"}
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits || result.body.hits.hits.length == 0) {
            throw new NotFoundException('blocks_not_found');
        }

        return result.body.hits.hits.map((block) => classToPlain(new BlockResponse(block._source)));
    }

    @Get('latest')
    async latest() {
        // We get the last block stored in ES
        const result = await ElasticService.getInstance().documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 1,
            sort: {"height": "desc"}
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits || result.body.hits.hits.length !== 1) {
            throw new NotFoundException('latest_block_not_found');
        }

        const lastBlock = result.body.hits.hits[0];
        return classToPlain(new BlockResponse(lastBlock._source));
    }

    @Get(':height')
    async show(@Req() req: Request) {
        if(!(await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_BLOCKS, req.params.height))){
            throw new NotFoundException('block_not_found');
        }

        // We get the block from ES
        const result = await ElasticService.getInstance().documentGet(ElasticIndexes.INDEX_BLOCKS, req.params.height);
        if (!result || !result.body || !result.body._source) {
            throw new InternalServerErrorException('failed_to_fetch_block');
        }

        return classToPlain(new BlockResponse(result.body._source));
    }
}
