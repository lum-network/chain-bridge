import { AssetDenum, AssetMicroDenum, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { ChainService, LumNetworkService } from '@app/services';
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
            // Tvl from all external chains with the tvl of lumNetwork summed up together
            const [chainTvl, lumTvl] = await Promise.all([this._chainService.getTvl(), this._lumNetworkService.getTvl()]);

            return [chainTvl, lumTvl]
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
            const [chainApy, lumApy] = await Promise.all([this._chainService.getApy(), this._lumNetworkService.getApy()]);

            return [chainApy, lumApy]
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
            const [supply, accountBalance, computedTvl] = await Promise.all([this.getTokenSupply(), this.getCashInVault(), this.getTotalComputedTvl()]);

            return (supply * accountBalance) / computedTvl;
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getDfrMintRatio = async (): Promise<number> => {
        try {
            // To get the MinRatio we do (DFR to Mint + dfr token supply) / (total computed tvl across all assets we have the index)
            const [dfrToMint, computedTvl, tokenSupply] = await Promise.all([this.getNewDfrToMint(), this.getTotalComputedTvl(), this.getTokenSupply()]);

            return (dfrToMint + tokenSupply) / computedTvl;
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
            const [dfrToMintPrice, supply] = await Promise.all([this.getDfrBackingPrice(), this.getTokenSupply()]);

            return dfrToMintPrice * supply;
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
            const [chainServiceTvl, lumTvl, chainServiceApy, lumApy, computedTvl] = await Promise.all([
                this._chainService.getTvl(),
                this._lumNetworkService.getTvl(),
                this._chainService.getApy(),
                this._lumNetworkService.getApy(),
                this.getTotalComputedTvl(),
            ]);

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
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`, error);

            Sentry.captureException(error);

            return null;
        }
    };

    getAssetInfo = async (): Promise<AssetInfo> => {
        try {
            // DFR asset info representing the {unit_price_usd, total_value_usd, supply, apy}
            const [unit_price_usd, total_value_usd, supply, apy] = await Promise.all([this.getDfrBackingPrice(), this.getMcap(), this.getTokenSupply(), this.getApy()]);

            return { unit_price_usd, total_value_usd, supply, apy };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract...', error);

            Sentry.captureException(error);

            return null;
        }
    };
}
