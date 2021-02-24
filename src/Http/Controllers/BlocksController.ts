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

    constructor(private readonly _elasticService: ElasticService) {
    }

    @Get('')
    async fetch() {
        // We get the 50 last block stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 50,
            sort: {"height": "desc"}
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits) {
            throw new NotFoundException('blocks_not_found');
        }

        return result.body.hits.hits.map((block) => classToPlain(new BlockResponse(block._source)));
    }

    @Get('latest')
    async latest() {
        // We get the last block stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 1,
            sort: {"height": "desc"}
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits || result.body.hits.hits.length !== 1) {
            throw new NotFoundException('latest_block_not_found');
        }

        const lastBlock = result.body.hits.hits[0];
        const source = lastBlock._source;

        // Acquire the transactions
        if(source && source.transactions && source.transactions.length > 0) {
            for (const [k, v] of lastBlock.transactions.entries()) {
                const tx = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, v);
                source.transactions[k] = tx.body._source
            }
        }

        return classToPlain(new BlockResponse(source));
    }

    @Get(':height')
    async show(@Req() req: Request) {
        if (!(await this._elasticService.documentExists(ElasticIndexes.INDEX_BLOCKS, req.params.height))) {
            throw new NotFoundException('block_not_found');
        }

        // We get the block from ES
        const result = await this._elasticService.documentGet(ElasticIndexes.INDEX_BLOCKS, req.params.height);
        if (!result || !result.body || !result.body._source) {
            throw new InternalServerErrorException('failed_to_fetch_block');
        }
        const source = result.body._source;

        // Acquire the transactions
        if(source && source.transactions && source.transactions.length > 0) {
            for (const [k, v] of source.transactions.entries()) {
                const tx = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, v);
                source.transactions[k] = tx.body._source
            }
        }

        return classToPlain(new BlockResponse(source));
    }
}
