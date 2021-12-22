import {Injectable, Logger} from '@nestjs/common';
import { LumClient } from '@lum-network/sdk-javascript';

import { config } from '@app/utils/config';

@Injectable()
export class LumNetworkService {
    private _client: LumClient = null;
    private readonly _logger: Logger = new Logger(LumNetworkService.name);

    initialise = async () => {
        try {
            this._client = await LumClient.connect(config.getLumNetworkEndpoint());
            const chainId = await this._client.getChainId();
            this._logger.log(`Connection established to Lum Network on ${config.getLumNetworkEndpoint()} = ${chainId}`)
        } catch (e) {
            console.error(e);
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
