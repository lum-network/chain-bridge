import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class SentinelService {
    private readonly _logger: Logger = new Logger(SentinelService.name);
    private _sentinelClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeSentinel = async () => {
        try {
            this._sentinelClient = await LumClient.connect(this._configService.get<string>('SENTINEL_NETWORK_ENDPOINT'));
            const chainId = await this._sentinelClient.getChainId();
            this._logger.log(`Connection established to Sentinel Network on ${this._configService.get<string>('SENTINEL_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedSentinel = (): boolean => {
        return this._sentinelClient !== null;
    };

    get sentinelClient(): LumClient {
        return this._sentinelClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/dvpn`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Sentinel...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.SENTINEL).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Sentinel...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.sentinelClient.getSupply('udvpn'), 'dvpn'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Sentinel...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this.sentinelClient, Number(await this.getTokenSupply()), 0.5, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getDvpnApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getDvpnApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Sentinel...`);
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
            this._logger.error('Failed to compute Token Info for Sentinel...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('sent', this.sentinelClient, 'udvpn', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = totalToken * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Sentinel...', error);
        }
    };
}
