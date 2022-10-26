import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { CLIENT_PRECISION, computeTotalAmount, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class StargazeService {
    private readonly _logger: Logger = new Logger(StargazeService.name);
    private _stargazeClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeStargaze = async () => {
        try {
            this._stargazeClient = await LumClient.connect(this._configService.get<string>('STARGAZE_NETWORK_ENDPOINT'));
            const chainId = await this._stargazeClient.getChainId();
            this._logger.log(`Connection established to Stargaze Network on ${this._configService.get<string>('STARGAZE_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedStargaze = (): boolean => {
        return this._stargazeClient !== null;
    };

    get stargazeClient(): LumClient {
        return this._stargazeClient;
    }

    getPrice = async (): Promise<any> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/stars`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Stargaze...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.STARGAZE).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Stargaze...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.stargazeClient.getSupply('ustars'), 'stars'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Stargaze...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // Cannot get inflation via Stargaze chain - We rely on their endpoint based on the official documentation
            const getStarsApy = await lastValueFrom(this._httpService.get(`https://supply-api.publicawesome.dev/apr`).pipe(map((response) => response.data)));

            return getStarsApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Stargaze...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()])
                .then(([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }))
                .catch(() => null);

            return {
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Stargaze...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('stars', this.stargazeClient, 'ustars', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Stargaze...', error);
        }
    };
}
