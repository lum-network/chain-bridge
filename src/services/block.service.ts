import { Injectable } from '@nestjs/common';
import { ElasticService } from '@app/services/elastic.service';
import { ElasticIndexes } from '@app/utils';

@Injectable()
export class BlockService {
    constructor(private readonly _elasticService: ElasticService) {}

    fetch = async (): Promise<any[]> => {
        // We get the 50 last block stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 50,
            sort: { height: 'desc' },
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits) {
            return null;
        }

        return result.body.hits.hits;
    };

    getLatest = async (): Promise<any> => {
        // We get the last block stored in ES
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 1,
            sort: { height: 'desc' },
        });

        if (!result || !result.body || !result.body.hits || !result.body.hits.hits || result.body.hits.hits.length !== 1) {
            return null;
        }

        const lastBlock = result.body.hits.hits[0];
        const source = lastBlock._source;

        // Acquire the transactions
        if (source && source.transactions && source.transactions.length > 0) {
            for (const [k, v] of lastBlock.transactions.entries()) {
                const tx = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, v);
                source.transactions[k] = tx.body._source;
            }
        }

        return source;
    };

    get = async (height: number): Promise<any> => {
        if (!(await this._elasticService.documentExists(ElasticIndexes.INDEX_BLOCKS, height))) {
            return null;
        }

        // We get the block from ES
        const result = await this._elasticService.documentGet(ElasticIndexes.INDEX_BLOCKS, height);
        if (!result || !result.body || !result.body._source) {
            return null;
        }

        const source = result.body._source;
        // Acquire the transactions
        if (source && source.tx_hashes && source.tx_hashes.length > 0) {
            source.transactions = [];

            for (const [k, v] of source.tx_hashes.entries()) {
                const tx = await this._elasticService.documentGet(ElasticIndexes.INDEX_TRANSACTIONS, v);

                source.transactions[k] = tx.body._source;
            }
        }

        return source;
    };
}
