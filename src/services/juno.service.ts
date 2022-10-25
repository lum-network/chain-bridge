import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { CLIENT_PRECISION, computeTotalAmount, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class JunoService {
    private readonly _logger: Logger = new Logger(JunoService.name);
    private _junoClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeJuno = async () => {
        try {
            this._junoClient = await LumClient.connect(this._configService.get<string>('JUNO_NETWORK_ENDPOINT'));
            const chainId = await this._junoClient.getChainId();
            this._logger.log(`Connection established to Juno Network on ${this._configService.get<string>('JUNO_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedJuno = (): boolean => {
        return this._junoClient !== null;
    };

    get junoClient(): LumClient {
        return this._junoClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/juno`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Juno...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.JUNO).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Juno...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.junoClient.getSupply('ujuno'), 'juno'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Juno...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // Cannot get inflation via Juno chain - We rely on their endpoint based on the official documentation
            const getApy = await lastValueFrom(this._httpService.get(`https://supply-api.junonetwork.io/apr`).pipe(map((response) => response.data)));

            return getApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Juno...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }),
            );

            return {
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Juno...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('juno', this.junoClient, 'ujuno', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Juno...', error);
        }
    };
}
