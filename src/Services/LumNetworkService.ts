import { Injectable } from '@nestjs/common';
import { LumClient } from '@lum-network/sdk-javascript';

import { config } from '@app/Utils/Config';

@Injectable()
export default class LumNetworkService {
    private _client: LumClient;

    constructor() {
        LumClient.connect(config.getLumNetworkEndpoint()).then((client) => {
            this._client = client;
        });
    }

    getClient = (): LumClient => {
        return this._client;
    };
}
