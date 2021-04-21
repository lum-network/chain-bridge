import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ElasticService } from '@app/Services';
import { ElasticIndexes } from '@app/Utils/Constants';
import { TransactionResponse } from '@app/Http/Responses';

@Controller('transactions')
@UseInterceptors(CacheInterceptor)
export default class TransactionsController {
    constructor(private readonly _elasticService: ElasticService) {}

    @Get('')
    async fetch() {
        // We get the 50 last transactions stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            size: 50,
            sort: { time: 'desc' },
            query: {
                match_all: {},
            },
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits) {
            throw new NotFoundException('transactions_not_found');
        }

        return result.body.hits.hits.map(tx => plainToClass(TransactionResponse, tx._source));
    }

    @Get(':hash')
    async show(@Param('hash') hash: string) {
        if (!(await this._elasticService.documentExists(ElasticIndexes.INDEX_TRANSACTIONS, hash))) {
            throw new NotFoundException('transaction_not_found');
        }

        // We get the transaction from ES
        const result = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, hash);
        if (!result || !result.body || !result.body._source) {
            throw new NotFoundException('failed_to_fetch_transaction');
        }

        return plainToClass(TransactionResponse, result.body._source);
    }
}
