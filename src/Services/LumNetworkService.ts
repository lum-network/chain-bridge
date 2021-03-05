import { Injectable } from '@nestjs/common';
import { LumClient } from '@lum-network/sdk-javascript';

import { config } from '@app/Utils/Config';

@Injectable()
export default class LumNetworkService {
    private _client: LumClient = null;

    initialise = async () => {
        try {
            this._client = await LumClient.connect(config.getLumNetworkEndpoint());
        } catch (e) {
        }
    };

    isInitialized = (): boolean => {
        return this._client !== null;
    };

    getClient = async (): Promise<LumClient> => {
        if (!this._client) {
            await this.initialise();
        }
        return this._client;
    };
}
