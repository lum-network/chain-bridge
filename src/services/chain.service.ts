import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CHAIN_ENV_CONFIG, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetSymbol, DfractDenum, DfractMicroDenum, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class ChainService {
    private readonly _logger: Logger = new Logger(ChainService.name);
    private _chainClient: LumClient = null;
    private _client: LumClient[] = [];
    private _tokenSupply: number = null;

    private _assetSymbol = Object.values(DfractAssetSymbol).map((key) => key);
    private _assetMicroDenum = Object.values(DfractMicroDenum).map((key) => key);
    private _assetDenum = Object.values(DfractDenum).map((key) => key);

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initialize = async () => {
        try {
            for (const id of CHAIN_ENV_CONFIG) {
                this._chainClient = await LumClient.connect(this._configService.get<string>(id));
                const chainId = await this._chainClient.getChainId();

                this._client.push(this._chainClient);

                this._logger.log(`Connection established to ${id} ${this._configService.get<string>(id)} = ${chainId}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    isInitialized = (): boolean => {
        return this._client !== null;
    };

    client = (): LumClient => {
        return this._chainClient;
    };

    getPrice = async (): Promise<number> => {
        try {
            // Observable to get the prices and filter with the one we represent in the index
            const price = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/all`).pipe(map((response) => response.data)));

            return price
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol))
                .map((el) => ({
                    symbol: el.symbol,
                    price: el.price,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Price Market Cap...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            // Observable to get the mcap and filter with the one we represent in the index
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));

            return getMktCap
                .filter((el) => this._assetSymbol.some((f) => f === el.symbol))
                .map((el) => ({
                    total_value_usd: el.market_cap,
                    symbol: el.symbol,
                }));
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for External Chains...`);
        }
    };

    getTokenSupply = async (): Promise<any> => {
        try {
            const getTokenSupply = Number(convertUnit(await client.getSupply('uakt'), 'akt'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for External Chains...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this._chainClient, Number(await this.getTokenSupply()), CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getAktApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getAktApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for AkashNetwork...`);
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
            this._logger.error('Failed to compute Token Info for AkashNetwork...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('akash', this._chainClient, 'uakt', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for AkashNetwork...', error);
        }
    };
}
