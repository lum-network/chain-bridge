import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http/responses/dfract.response';

@Injectable()
export class ComdexService {
    private readonly _logger: Logger = new Logger(ComdexService.name);
    private _comdexClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeComdex = async () => {
        try {
            this._comdexClient = await LumClient.connect(this._configService.get<string>('COMDEX_NETWORK_ENDPOINT'));
            const chainId = await this._comdexClient.getChainId();
            this._logger.log(`Connection established to Comdex Network on ${this._configService.get<string>('COMDEX_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedComdex = (): boolean => {
        return this._comdexClient !== null;
    };

    get comdexClient(): LumClient {
        return this._comdexClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/cmdx`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Comdex...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.COMDEX).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Comdex...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.comdexClient.getSupply('ucmdx'), 'cmdx'));

            console.log('token supply inside comdex', getTokenSupply);

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Comdex...`);
        }
    };

    getApy = async (): Promise<any> => {
        try {
            const metrics = await computeApyMetrics(this.comdexClient, Number(await this.getTokenSupply()), 0.5, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            console.log('metrics', metrics);

            const getCmdxApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            console.log('getCmdxApy', getCmdxApy);

            return getCmdxApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Comdex...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()])
                .then(([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }))
                .catch(() => null);

            const ComdexToken = {
                ...getTokenInfo,
            };

            return ComdexToken;
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Comdex...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('comdex', this.comdexClient, 'ucmdx', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Comdex...', error);
        }
    };
}
