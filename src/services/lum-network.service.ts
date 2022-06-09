import {HttpService} from "@nestjs/axios";
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

import {LumClient} from '@lum-network/sdk-javascript';

import {OSMOSIS_API_URL} from "@app/utils";


@Injectable()
export class LumNetworkService {
    private _client: LumClient = null;
    private readonly _logger: Logger = new Logger(LumNetworkService.name);

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {
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

    get client(): LumClient {
        return this._client;
    }

    getPrice = (): Promise<any> => {
        return this._httpService.get(`${OSMOSIS_API_URL}/tokens/v2/LUM`).toPromise();
    }

    getPreviousDayPrice = (): Promise<any> => {
        return this._httpService.get(`${OSMOSIS_API_URL}/tokens/v2/historical/LUM/chart?tf=60`).toPromise();
    }
}
