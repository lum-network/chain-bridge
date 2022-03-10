import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { Bulk } from '@elastic/elasticsearch/api/requestParams';

import { ElasticIndexes } from '@app/utils/constants';
import { config } from '@app/utils/config';

@Injectable()
export class ElasticService {
    private readonly _client: Client;

    constructor() {
        this._client = new Client({
            node: `http://${config.getElasticSearchHost()}:${config.getElasticSearchPort()}`,
        });
    }

    public documentSearch = (index: ElasticIndexes, body: any) => {
        return this._client.search({
            index,
            body,
        });
    };

    public documentExists = async (index: ElasticIndexes, id: any): Promise<boolean> => {
        const { body } = await this._client.exists({
            index,
            id,
        });
        return body;
    };

    public documentCreate = (index: ElasticIndexes, id: any, body: any) => {
        return this._client.index({
            index,
            id,
            body,
        });
    };

    public documentGet = (index: ElasticIndexes, id: any) => {
        return this._client.get({
            index,
            id,
        });
    };

    public documentUpdate = (index: ElasticIndexes, id: any, body: any) => {
        return this._client.update({
            index,
            id,
            body: { doc: body },
        });
    };

    public bulkUpdate = (params: Bulk) => {
        return this._client.bulk(params);
    };

    public indexCreate = (index: ElasticIndexes | string, body: any) => {
        return this._client.indices.create({
            index,
            body,
        });
    };

    public indexExists = async (index: ElasticIndexes | string): Promise<boolean> => {
        const { body } = await this._client.indices.exists({
            index,
        });
        return body;
    };

    public indexClear = async (index: ElasticIndexes | string): Promise<void> => {
        await this._client.deleteByQuery({
            index,
            body: {
                query: {
                    match_all: {},
                },
            },
        });
    };

    get client(): Client {
        return this._client;
    }
}
