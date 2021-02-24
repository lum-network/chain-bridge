import { Client } from '@elastic/elasticsearch';
import { ElasticIndexes } from '@app/Utils/Constants';
import { config } from '@app/Utils/Config';

export default class ElasticService {
    private static _instance: ElasticService;
    private _client: Client;

    constructor() {
        this._client = new Client({
            node: `http://${config.getValue<string>('ELASTICSEARCH_HOST')}:${config.getValue<number>(
                'ELASTICSEARCH_PORT',
            )}`,
        });
    }

    public static getInstance = (): ElasticService => {
        if (!ElasticService._instance) {
            ElasticService._instance = new ElasticService();
        }
        return ElasticService._instance;
    };

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

    get client(): Client {
        return this._client;
    }
}
