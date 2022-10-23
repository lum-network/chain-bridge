import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LumClient } from '@lum-network/sdk-javascript';
import { lastValueFrom, map } from 'rxjs';
import { apy, CLIENT_PRECISION, computeApyMetrics, computeTotalAmount, DfractAssetName, DfractAssetSymbol, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class AkashNetworkService {
    private readonly _logger: Logger = new Logger(AkashNetworkService.name);
    private _akashNetworkClient: LumClient = null;

    constructor(private readonly _configService: ConfigService, private readonly _httpService: HttpService) {}

    initializeAkashNetwork = async () => {
        try {
            this._akashNetworkClient = await LumClient.connect(this._configService.get<string>('AKASH_NETWORK_ENDPOINT'));
            const chainId = await this._akashNetworkClient.getChainId();
            this._logger.log(`Connection established to AkashNetwork Network on ${this._configService.get<string>('AKASH_NETWORK_ENDPOINT')} = ${chainId}`);
        } catch (e) {
            console.error(e);
        }
    };

    isInitializedAkashNetwork = (): boolean => {
        return this._akashNetworkClient !== null;
    };

    get akashNetworkClient(): LumClient {
        return this._akashNetworkClient;
    }

    getPrice = async (): Promise<number> => {
        try {
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/akt`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from AkashNetwork...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMktCap = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/mcap`).pipe(map((response) => response.data)));
            const getMcap = getMktCap.filter((el) => el.symbol === DfractAssetSymbol.AKASH_NETWORK).map((el) => el.market_cap)[0];

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for AkashNetwork...`);
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.akashNetworkClient.getSupply('uakt'), 'akt'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for AkashNetwork...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this.akashNetworkClient, Number(await this.getTokenSupply()), CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getAktApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getAktApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for AkashNetwork...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unitPriceUsd, totalValueUsd, supply, apy]) => ({ unitPriceUsd, totalValueUsd, supply, apy }),
            );

            return {
                name: DfractAssetName.AKASH_NETWORK,
                symbol: DfractAssetSymbol.AKASH_NETWORK,
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for AkashNetwork...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('akash', this.akashNetworkClient, 'uakt', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for AkashNetwork...', error);
        }
    };
}
