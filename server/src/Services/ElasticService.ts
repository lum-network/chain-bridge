import {Client} from '@elastic/elasticsearch';
import {ElasticIndexes} from "@app/Utils/Constants";

export default class ElasticService {
    private static _instance: ElasticService;
    private _client: Client;

    constructor() {
        this._client = new Client({node: 'http://localhost:9200'});
    }

    public static getInstance = (): ElasticService => {
        if (!ElasticService._instance) {
            ElasticService._instance = new ElasticService();
        }
        return ElasticService._instance;
    }

    public documentSearch = (index: ElasticIndexes, query: any) => {
        return this._client.search({
            index,
            body: {query}
        });
    }

    public documentExists = async (index: ElasticIndexes, id: any): Promise<boolean> => {
        const {body} = await this._client.exists({
            index,
            id
        });
        return body;
    }

    public documentCreate = async (index: ElasticIndexes, id: any, body: any) => {
        return this._client.index({
            index, id, body
        });
    }

    public documentGet = async (index: ElasticIndexes, id: string) => {
        return this._client.get({
            index,
            id
        });
    }

    public indexCreate = (index: ElasticIndexes | string, body: any) => {
        return this._client.indices.create({
            index,
            body
        });
    }

    public indexExists = async (index: ElasticIndexes | string): Promise<boolean> => {
        const {body} = await this._client.indices.exists({
            index
        });
        return body;
    }
}
