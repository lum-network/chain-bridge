import { Injectable } from '@nestjs/common';
import { ElasticService } from '@app/services/elastic.service';
import { ElasticIndexes } from '@app/utils';

@Injectable()
export class TransactionService {
    constructor(private readonly _elasticService: ElasticService) {}

    fetch = async (): Promise<any[]> => {
        // We get the 50 last transactions stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            size: 50,
            sort: { time: 'desc' },
            query: {
                match_all: {},
            },
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits) {
            return null;
        }

        return result.body.hits.hits;
    };

    get = async (hash: string): Promise<any> => {
        if (!(await this._elasticService.documentExists(ElasticIndexes.INDEX_TRANSACTIONS, hash))) {
            return null;
        }

        // We get the transaction from ES
        const result = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, hash);
        if (!result || !result.body || !result.body._source) {
            return null;
        }

        return result.body._source;
    };
}
