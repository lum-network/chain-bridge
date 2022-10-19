import {Injectable} from "@nestjs/common";

import {Client} from "@elastic/elasticsearch";

@Injectable()
export class ElasticsearchService {
    private readonly _client: Client;

    constructor() {
        this._client = new Client({
            node: 'http://localhost:9200'
        });
    }

    get client(): Client {
        return this._client;
    }
}
