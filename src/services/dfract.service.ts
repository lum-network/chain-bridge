import { Injectable, Logger } from '@nestjs/common';

import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import * as Sentry from '@sentry/node';

import { AssetService, ChainService, LumNetworkService } from '@app/services';
import { AssetDenom, AssetMicroDenom, TEN_EXPONENT_SIX } from '@app/utils';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(private readonly _assetService: AssetService, private readonly _chainService: ChainService, private readonly _lumNetworkService: LumNetworkService) {}

    /*
     * This method returns the actual DFR token supply
     */
    getTokenSupply = async (): Promise<number> => {
        try {
            return Number(convertUnit(await this._lumNetworkService.client.getSupply(AssetMicroDenom.DFR), AssetDenom.DFR));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method compute the current DFR tvl
     */
    getTotalComputedTvl = async (): Promise<number> => {
        try {
            const [chainTvl, lumTvl] = await Promise.all([this._chainService.getTvl(), this._lumNetworkService.getTvl()]);
            if (!chainTvl || !lumTvl) {
                return 0;
            }

            return [chainTvl, lumTvl]
                .flat()
                .map((el) => el.tvl)
                .reduce((prev, next) => prev + next);
        } catch (error) {
            this._logger.error(`Could not fetch Computed TVL for DFR on Lum Network...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    getPersistedTotalComputedTvl = async (): Promise<number> => {
        try {
            return Number(await this._assetService.getDfrTotalComputedTvl());
        } catch (error) {
            this._logger.error(`Could not fetch persisted tvl...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method returns the current available deposited cash in the module account
     */
    getAccountBalance = async (): Promise<number> => {
        try {
            return Number((await this._lumNetworkService.client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;
        } catch (error) {
            this._logger.error(`Could not compute cash available in vault for DFR on Lum Network...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    getPersistedAccountBalance = async (): Promise<number> => {
        try {
            return Number(await this._assetService.getDfrAccountBalance());
        } catch (error) {
            this._logger.error(`Could not fetch persisted account balance...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method returns the amount of DFR tokens to be minted
     */
    getNewDfrToMint = async (): Promise<number> => {
        try {
            const [supply, persistedAccountBalance, persistedComputedTvl] = await Promise.all([this.getTokenSupply(), this.getPersistedAccountBalance(), this.getPersistedTotalComputedTvl()]);
            return (supply * persistedAccountBalance) / persistedComputedTvl;
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method returns the mint ratio to use to mint new DFR tokens
     * Computed by dividing the amount of DFR tokens to be minted by the amount of cash available in the vault
     */
    getDfrMintRatio = async (): Promise<number> => {
        try {
            const [dfrToMint, persistedAccountBalance] = await Promise.all([this.getNewDfrToMint(), this.getPersistedAccountBalance()]);
            return dfrToMint / persistedAccountBalance;
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR...`, error);
            Sentry.captureException(error);
            return 0.0;
        }
    };

    /*
     * This method returns the DFR backing price by diving the mint ratio by 1
     */
    getDfrBackingPrice = async (): Promise<number> => {
        try {
            return 1 / Number(await this.getDfrMintRatio());
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price for DFR...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method returns the DFR market cap by multiplying the DFR backing price by the DFR token supply
     */
    getMcap = async (): Promise<number> => {
        try {
            const [dfrToMintPrice, supply] = await Promise.all([this.getDfrBackingPrice(), this.getTokenSupply()]);
            return dfrToMintPrice * supply;
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap...`, error);
            Sentry.captureException(error);
            return 0;
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

            if (tvl === null || apy === null) {
                this._logger.error(`Failed to compute TVL ${tvl} or APY ${apy} for DFR...`);
                return 0;
            }

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
            return 0;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    /*
     * This method returns the information from the DFR module to be used in pre gov-prop
     */
    getAssetInfoPreGovProp = async (): Promise<{ account_balance: number; tvl: number }> => {
        try {
            const [account_balance, tvl] = await Promise.all([this.getAccountBalance(), this.getTotalComputedTvl()]);
            return { account_balance, tvl };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract Pre Gov Prop...', error);
            Sentry.captureException(error);
            return { account_balance: 0, tvl: 0 };
        }
    };

    /*
     * This method returns the information from the DFR module to be used in post gov-prop
     */
    getAssetInfoPostGovProp = async (): Promise<{ unit_price_usd: number; total_value_usd: number; supply: number; apy: number }> => {
        try {
            const [unit_price_usd, total_value_usd, supply, apy] = await Promise.all([this.getDfrBackingPrice(), this.getMcap(), this.getTokenSupply(), this.getApy()]);
            return { unit_price_usd, total_value_usd, supply, apy };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract Post Gov Prop...', error);
            Sentry.captureException(error);
            return { unit_price_usd: 0, total_value_usd: 0, supply: 0, apy: 0 };
        }
    };
}
