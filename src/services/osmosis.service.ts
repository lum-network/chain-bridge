import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { CLIENT_PRECISION, computeTotalAmount, DfractAssetName, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class OsmosisService {
    private readonly _logger: Logger = new Logger(OsmosisService.name);
    private _osmosisClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeOsmosis = async () => {
        try {
            this._osmosisClient = await LumClient.connect(this._configService.get<string>('OSMOSIS_NETWORK_ENDPOINT'));
            const chainId = await this._osmosisClient.getChainId();
            this._logger.log(`Connection established to Osmosis Network on ${this._configService.get<string>('OSMOSIS_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedOsmosis = (): boolean => {
        return this._osmosisClient !== null;
    };

    get osmosisClient(): LumClient {
        return this._osmosisClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/osmo`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Osmosis...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.OSMOSIS).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Osmosis...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.osmosisClient.getSupply('uosmo'), 'osmo'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Osmosis...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // Cannot get the inflation on chain. We rely on their official endpoint to get the apr
            const getApy = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/apr/v2/staking`).pipe(map((response) => response.data)));

            return getApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Osmosis...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unitPriceUsd, totalValueUsd, supply, apy]) => ({ unitPriceUsd, totalValueUsd, supply, apy }),
            );

            return {
                name: DfractAssetName.OSMOSIS,
                symbol: DfractAssetSymbol.OSMOSIS,
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Osmosis...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('osmo', this._osmosisClient, 'uosmo', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Osmos...', error);
        }
    };
}
