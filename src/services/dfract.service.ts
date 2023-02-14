import { Injectable, Logger } from '@nestjs/common';

import { AssetService, ChainService } from '@app/services';
import { AssetSymbol, getUniqueSymbols, TEN_EXPONENT_SIX } from '@app/utils';
import { LumChain } from '@app/services/chains';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(private readonly _assetService: AssetService, private readonly _chainService: ChainService) {}

    /*
     * This method returns the actual DFR token supply
     */
    getTokenSupply = async (): Promise<number> => {
        return this._chainService.getChain(AssetSymbol.DFR).getTokenSupply();
    };

    /*
     * This method compute the current DFR tvl
     */
    getTotalComputedTvl = async (): Promise<number> => {
        const [chainTvl, lumTvl] = await Promise.all([this._chainService.getTvl(), this._chainService.getChain(AssetSymbol.LUM).getTVL()]);

        if (!chainTvl || !lumTvl) {
            return 0;
        }

        const totalTVL = chainTvl
            .flat()
            .map((el) => el.tvl)
            .reduce((a, b) => a + b, 0);

        return totalTVL + lumTvl;
    };

    getPersistedTotalComputedTvl = async (): Promise<number> => {
        return this._assetService.getDfrTotalComputedTvl();
    };

    /*
     * This method returns the current available deposited cash in the module account
     */
    getAccountBalance = async (): Promise<number> => {
        return Number((await this._chainService.getChain(AssetSymbol.DFR).client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;
    };

    getPersistedAccountBalance = async (): Promise<number> => {
        return this._assetService.getDfrAccountBalance();
    };

    /*
     * This method returns the amount of DFR tokens to be minted
     */
    getNewDfrToMint = async (): Promise<number> => {
        const [supply, persistedAccountBalance, persistedComputedTvl] = await Promise.all([this.getTokenSupply(), this.getPersistedAccountBalance(), this.getPersistedTotalComputedTvl()]);
        return (supply * persistedAccountBalance) / persistedComputedTvl;
    };

    /*
     * This method returns the mint ratio to use to mint new DFR tokens
     * Computed by dividing the amount of DFR tokens to be minted by the amount of cash available in the vault
     */
    getDfrMintRatio = async (): Promise<number> => {
        const [dfrToMint, persistedAccountBalance] = await Promise.all([this.getNewDfrToMint(), this.getPersistedAccountBalance()]);
        return dfrToMint / persistedAccountBalance;
    };

    /*
     * This method returns the DFR backing price by diving the mint ratio by 1
     */
    getDfrBackingPrice = async (): Promise<number> => {
        return 1 / Number(await this.getDfrMintRatio());
    };

    /*
     * This method returns the DFR market cap by multiplying the DFR backing price by the DFR token supply
     */
    getMcap = async (): Promise<number> => {
        const [dfrToMintPrice, supply] = await Promise.all([this.getDfrBackingPrice(), this.getTokenSupply()]);
        return dfrToMintPrice * supply;
    };

    getApy = async (): Promise<number> => {
        // We compute the apy from DFR based on the following formula
        // (token tvl (price * token amount) * token apy) / total computed tvl
        // We first aggregate the tvl from lum and the other chains, then the apy
        // Computed post gov prop
        let tvl = null;
        let apy = null;

        const [chainServiceTvl, lumTvl, chainServiceApy, lumApy] = await Promise.all([
            this._chainService.getTvl(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getTVL(),
            this._assetService.getAPYs(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getAPY(),
        ]);

        // Only keep the last inserted symbols for apy
        const filterChainApy = getUniqueSymbols(chainServiceApy);

        // We compute the tvl for external chains and lum
        if (chainServiceTvl && lumTvl) {
            tvl = [...chainServiceTvl, { symbol: AssetSymbol.LUM, tvl: lumTvl }];
        }

        if (filterChainApy && lumApy) {
            apy = [...filterChainApy, { symbol: AssetSymbol.LUM, apy: lumApy }];
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
    };

    /*
     * This method returns the information from the DFR module to be used in pre gov-prop
     */
    getAssetInfoPreGovProp = async (): Promise<{ account_balance: number; tvl: number }> => {
        const [account_balance, tvl] = await Promise.all([this.getAccountBalance(), this.getTotalComputedTvl()]);
        return { account_balance, tvl };
    };

    /*
     * This method returns the information from the DFR module to be used in post gov-prop
     */
    getAssetInfoPostGovProp = async (): Promise<{ unit_price_usd: number; total_value_usd: number; supply: number; apy: number }> => {
        const [unit_price_usd, total_value_usd, supply, apy] = await Promise.all([this.getDfrBackingPrice(), this.getMcap(), this.getTokenSupply(), this.getApy()]);
        return { unit_price_usd, total_value_usd, supply, apy };
    };
}
