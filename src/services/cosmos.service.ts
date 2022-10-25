import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class CosmosService {
    private readonly _logger: Logger = new Logger(CosmosService.name);
    private _cosmosClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeCosmos = async () => {
        try {
            this._cosmosClient = await LumClient.connect(this._configService.get<string>('COSMOS_NETWORK_ENDPOINT'));
            const chainId = await this._cosmosClient.getChainId();
            this._logger.log(`Connection established to Cosmos Network on ${this._configService.get<string>('COSMOS_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedCosmos = (): boolean => {
        return this._cosmosClient !== null;
    };

    get cosmosClient(): LumClient {
        return this._cosmosClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/atom`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Cosmos...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.COSMOS).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Cosmos...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.cosmosClient.getSupply('uatom'), 'atom'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Cosmos...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this.cosmosClient, Number(await this.getTokenSupply()), CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getAtomApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getAtomApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Cosmos...`);
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
            this._logger.error('Failed to compute Token Info for Cosmos...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('cosmos', this._cosmosClient, 'uatom', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Cosmos...', error);
        }
    };
}
