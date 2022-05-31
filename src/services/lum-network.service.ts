import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

import {LumClient} from '@lum-network/sdk-javascript';


@Injectable()
export class LumNetworkService {
    private _client: LumClient = null;
    private readonly _logger: Logger = new Logger(LumNetworkService.name);

    constructor(private readonly _configService: ConfigService) {
    }

    initialise = async () => {
        try {
            this._client = await LumClient.connect(this._configService.get<string>('LUM_NETWORK_ENDPOINT'));
            const chainId = await this._client.getChainId();
            this._logger.log(`Connection established to Lum Network on ${this._configService.get<string>('LUM_NETWORK_ENDPOINT')} = ${chainId}`);
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
