import {Controller, Get, NotFoundException, Req} from "@nestjs/common";
import {Request} from "express";
import {classToPlain} from "class-transformer";
import {ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";
import {TransactionResponse} from "@app/Http/Responses";

@Controller('transactions')
export default class TransactionsController {
    @Get('')
    async fetch(){
        // We get the 50 last transactions stored in ES
        const result = await ElasticService.getInstance().documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            size: 50,
            sort: {"dispatched_at": "desc"},
            query: {
                match_all: {}
            }
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits || result.body.hits.hits.length == 0) {
            throw new NotFoundException('transactions_not_found');
        }

        return result.body.hits.hits.map((block) => classToPlain(new TransactionResponse(block._source)));
    }

    @Get(':hash')
    async show(@Req() req: Request){
        // We get the transaction from ES
        const result = await ElasticService.getInstance().documentGet(ElasticIndexes.INDEX_TRANSACTIONS, req.params.hash);
        if (!result || !result.body || !result.body._source) {
            throw new NotFoundException('transaction_not_found');
        }

        return classToPlain(new TransactionResponse(result.body._source));
    }
}
