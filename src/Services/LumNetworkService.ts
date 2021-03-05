import { Injectable } from '@nestjs/common';
import { LumClient } from '@lum-network/sdk-javascript';

import { config } from '@app/Utils/Config';

@Injectable()
export default class LumNetworkService {
    private _client: LumClient = null;

    constructor() {
        this.initialise().finally(() => null);
    }

    initialise = async () => {
        this._client = await LumClient.connect(config.getLumNetworkEndpoint());
    };

    getClient = async (): Promise<LumClient> => {
        if (!this._client) {
            await this.initialise();
        }
        return this._client;
    };
}
