import { AssetDenum, AssetMicroDenum, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { LumNetworkService, ChainService } from '@app/services';
import { AssetInfo } from '@app/http';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(private readonly _chainService: ChainService, private readonly _lumNetworkService: LumNetworkService) {}

    getTokenSupply = async (): Promise<number> => {
        try {
            // Total current circulating dfr token
            return Number(convertUnit(await this._lumNetworkService.client.getSupply(AssetMicroDenum.DFR), AssetDenum.DFR));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getTotalComputedTvl = async (): Promise<any> => {
        try {
            // Apy from all external chains with the tvl of lumNetwork summed up together
            const getMetricsToComputeTotalTvl = [await this._chainService.getTvl(), await this._lumNetworkService.getTvl()];

            return (await Promise.all(getMetricsToComputeTotalTvl))
                .flat()
                .map((el) => el.tvl)
                .reduce((prev, next) => prev + next);
        } catch (error) {
            this._logger.error(`Could not fetch Computed TVL for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getTotalComputedApy = async (): Promise<any> => {
        try {
            // Apy from all external chains with the apy of lumNetwork summed up together
            const getMetricsToComputeTotalApy = [await this._chainService.getApy(), await this._lumNetworkService.getApy()];

            return (await Promise.all(getMetricsToComputeTotalApy))
                .flat()
                .map((el) => el.apy)
                .reduce((prev, next) => prev + next);
        } catch (error) {
            this._logger.error(`Could not fetch Computed APY for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getCashInVault = async (): Promise<number> => {
        try {
            // Represents the available deposited cash in our account balance
            return Number((await this._lumNetworkService.client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;
        } catch (error) {
            this._logger.error(`Could not compute cash available in vault for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getNewDfrToMint = async (): Promise<number> => {
        try {
            // The new dfr to be minted is calculated by (dfr supply * cash in vault (balance)) / (total computed tvl)
            const getMetricsToComputeDfrToMint = [Number(await this.getTokenSupply()), Number(await this.getCashInVault()), Number(await this.getTotalComputedTvl())];

            return Promise.all(getMetricsToComputeDfrToMint).then(([supply, accountBalance, computedTvl]) => (supply * accountBalance) / computedTvl);
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getDfrMintRatio = async (): Promise<number> => {
        try {
            // To get the MinRatio we do (DFR to Mint + dfr token supply) / (total computed tvl across all assets we have the index)
            const getMetricsToComputeMintRatio = [Number(await this.getNewDfrToMint()), Number(await this.getTotalComputedTvl()), Number(await this.getTokenSupply())];

            return Promise.all(getMetricsToComputeMintRatio).then(([dfrToMint, computedTvl, tokenSupply]) => (dfrToMint + tokenSupply) / computedTvl);
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getDfrBackingPrice = async (): Promise<number> => {
        try {
            // To get dfr price we divide the mintRatio by 1
            return 1 / Number(await this.getDfrMintRatio());
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            // We compute the market cap by multiplying the backing price by the dfr token supply
            const getMetricsToComputeMcap = [Number(await this.getDfrBackingPrice()), Number(await this.getTokenSupply())];

            return Promise.all(getMetricsToComputeMcap).then(([dfrToMintPrice, supply]) => dfrToMintPrice * supply);
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // We compute the apy from DFR based on the following formula
            // (token tvl (price * token amount) * token apy) / total computed tvl
            // We first aggregate the tvl from lum and the other chains, then the apy
            const getMetricsToComputeApy = [this._chainService.getTvl(), this._lumNetworkService.getTvl(), this._chainService.getApy(), this._lumNetworkService.getApy(), this.getTotalComputedTvl()];

            return await Promise.all(getMetricsToComputeApy).then(([chainServiceTvl, lumTvl, chainServiceApy, lumApy, computedTvl]) => {
                // We compute the tvl for external chains and lum
                const tvl = [...chainServiceTvl, lumTvl];
                // We compute the apy for external chains and lum
                const apy = [...chainServiceApy, lumApy];
                // Aggregate both tvl and apy from both chains to multiply tvl * token apy
                const merged = tvl
                    .map((item, i) => Object.assign({}, item, apy[i]))
                    .map((el) => Number(el.apy) * Number(el.tvl))
                    .reduce((prev, next) => prev + next);

                // We divide the aggregation by the computedTvl to get DFR apy
                return merged / computedTvl;
            });
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getAssetInfo = async (): Promise<AssetInfo> => {
        try {
            // DFR asset info representing the {unit_price_usd, total_value_usd, supply, apy}
            const getMetricsToComputeInfo = [this.getDfrBackingPrice(), this.getMcap(), this.getTokenSupply(), this.getApy()];

            return await Promise.all(getMetricsToComputeInfo).then(([unit_price_usd, total_value_usd, supply, apy]) => ({
                unit_price_usd,
                total_value_usd,
                supply,
                apy,
            }));
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract...', error);

            Sentry.captureException(error);

            return null;
        }
    };
}
