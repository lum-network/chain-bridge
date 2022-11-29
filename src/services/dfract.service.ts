import { AssetDenom, AssetMicroDenom, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { AssetService, ChainService, LumNetworkService } from '@app/services';
import { AssetInfo } from '@app/http';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(private readonly _assetService: AssetService, private readonly _chainService: ChainService, private readonly _lumNetworkService: LumNetworkService) {}

    getTokenSupply = async (): Promise<number> => {
        try {
            // Total current circulating dfr token
            // Will be computed post gov prop
            return Number(convertUnit(await this._lumNetworkService.client.getSupply(AssetMicroDenom.DFR), AssetDenom.DFR));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getTotalComputedTvl = async (): Promise<number> => {
        try {
            // Tvl from all external chains with the tvl of lumNetwork summed up together
            // Will be persisted pre gov prop
            const [chainTvl, lumTvl] = await Promise.all([this._chainService.getTvl(), this._lumNetworkService.getTvl()]);

            if (chainTvl && lumTvl) {
                return [chainTvl, lumTvl]
                    .flat()
                    .map((el) => el.tvl)
                    .reduce((prev, next) => prev + next);
            }
        } catch (error) {
            this._logger.error(`Could not fetch Computed TVL for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getPersistedTotalComputedTvl = async (): Promise<number> => {
        try {
            // Will serve to compute the new dfr to mint computed post gov prop
            return Number(await this._assetService.getDfrTotalComputedTvl());
        } catch (error) {
            this._logger.error(`Could not fetch persisted tvl...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getAccountBalance = async (): Promise<number> => {
        try {
            // Represents the available deposited cash in our account balance
            // Will be persisted pre gov prop
            return Number((await this._lumNetworkService.client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;
        } catch (error) {
            this._logger.error(`Could not compute cash available in vault for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getPersistedAccountBalance = async (): Promise<number> => {
        try {
            // Represents the available persisted cash in our account balance that serves to calculate the backing price
            // Computed post gov prop
            return Number(await this._assetService.getDfrAccountBalance());
        } catch (error) {
            this._logger.error(`Could not fetch persisted account balance...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getNewDfrToMint = async (): Promise<number> => {
        try {
            // The new chain dfr to be minted is calculated by (dfr supply * cash in vault (balance)) / (total computed tvl)
            // Computed post gov prop
            const [supply, persistedAccountBalance, persistedComputedTvl] = await Promise.all([this.getTokenSupply(), this.getPersistedAccountBalance(), this.getPersistedTotalComputedTvl()]);

            return (supply * persistedAccountBalance) / persistedComputedTvl;
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getDfrMintRatio = async (): Promise<number> => {
        try {
            // To get the MinRatio we do (dfrToMint / persistedAccountBalance)
            // Computed post gov prop
            const [dfrToMint, persistedAccountBalance] = await Promise.all([this.getNewDfrToMint(), this.getPersistedAccountBalance()]);

            return dfrToMint / persistedAccountBalance;
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getDfrBackingPrice = async (): Promise<number> => {
        try {
            // To get dfr price we divide the mintRatio by 1
            // Computed post gov prop
            return 1 / Number(await this.getDfrMintRatio());
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price for DFR...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            // We compute the market cap by multiplying the backing price by the dfr token supply
            // Computed post gov prop
            const [dfrToMintPrice, supply] = await Promise.all([this.getDfrBackingPrice(), this.getTokenSupply()]);

            return dfrToMintPrice * supply;
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // We compute the apy from DFR based on the following formula
            // (token tvl (price * token amount) * token apy) / total computed tvl
            // We first aggregate the tvl from lum and the other chains, then the apy
            // Computed post gov prop
            let tvl = null;
            let apy = null;

            const [chainServiceTvl, lumTvl, chainServiceApy, lumApy] = await Promise.all([
                this._chainService.getTvl(),
                this._lumNetworkService.getTvl(),
                this._assetService.getChainServiceApy(),
                this._lumNetworkService.getApy(),
            ]);

            // We compute the tvl for external chains and lum
            if (chainServiceTvl && lumTvl) {
                tvl = [...chainServiceTvl, lumTvl];
            }

            if (chainServiceApy && lumApy) {
                apy = [...chainServiceApy, lumApy];
            }
            // We compute the apy for external chains and lum

            // Aggregate both tvl and apy from both chains to multiply tvl * token apy
            const merged = tvl
                .map((item, i) => Object.assign({}, item, apy[i]))
                .map((el) => Number(el.apy) * Number(el.tvl))
                .reduce((prev, next) => prev + next);

            // chain tvl and lum tvl sumed up together
            const totalComputedTvl = tvl
                .flat()
                .map((el) => el.tvl)
                .reduce((prev, next) => prev + next);

            if (merged && totalComputedTvl) {
                // We divide the aggregation by the computedTvl to get DFR apy
                return merged / totalComputedTvl;
            }
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getAssetInfoPreGovProp = async (): Promise<AssetInfo> => {
        try {
            // Before the gov prop ends we want to save the account_balance, tvl
            // These will serve as a basis to calculate the backing price post gov prop
            const [account_balance, tvl] = await Promise.all([this.getAccountBalance(), this.getTotalComputedTvl()]);

            return { account_balance, tvl };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract Pre Gov Prop...', error);

            Sentry.captureException(error);

            return null;
        }
    };

    getAssetInfoPostGovProp = async (): Promise<AssetInfo> => {
        try {
            // After the gov prop has passed and the circulating supply has been updated we want to save unit_price_usd, total_value_usd, supply, apy
            const [unit_price_usd, total_value_usd, supply, apy] = await Promise.all([this.getDfrBackingPrice(), this.getMcap(), this.getTokenSupply(), this.getApy()]);

            return { unit_price_usd, total_value_usd, supply, apy };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract Post Gov Prop...', error);

            Sentry.captureException(error);

            return null;
        }
    };
}
