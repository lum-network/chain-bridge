import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetName, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class KichainService {
    private readonly _logger: Logger = new Logger(KichainService.name);
    private _kichainClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeKichain = async () => {
        try {
            this._kichainClient = await LumClient.connect(this._configService.get<string>('KICHAIN_NETWORK_ENDPOINT'));
            const chainId = await this._kichainClient.getChainId();
            this._logger.log(`Connection established to Kichain Network on ${this._configService.get<string>('KICHAIN_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedKichain = (): boolean => {
        return this._kichainClient !== null;
    };

    get kichainClient(): LumClient {
        return this._kichainClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/xki`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Kichain...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.KI).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Kichain...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.kichainClient.getSupply('uxki'), 'xki'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Kichain...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this.kichainClient, Number(await this.getTokenSupply()), CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getXkiApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getXkiApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Kichain...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }),
            );

            return {
                name: DfractAssetName.KI,
                symbol: DfractAssetSymbol.KI,
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Kichain...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('ki', this.kichainClient, 'uxki', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Kichain...', error);
        }
    };
}
