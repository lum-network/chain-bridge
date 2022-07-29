import {HttpService} from "@nestjs/axios";
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

import {LumClient} from '@lum-network/sdk-javascript';

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
        return this._httpService.get(`https://api.coingecko.com/api/v3/coins/lum-network`).toPromise();
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any> => {
        try {
            const res = await this._httpService.get(`https://api.coingecko.com/api/v3/coins/lum-network/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`).toPromise();
            return res.data.prices.map((price) => {
                return {
                    key: price[0],
                    value: price[1],
                };
            });
        } catch (e) {
            return [];
        }
    };
}
