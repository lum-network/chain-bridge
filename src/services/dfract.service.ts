import { AssetDenum, AssetMicroDenum, TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { Injectable, Logger } from '@nestjs/common';
import { LumNetworkService, ChainService } from '@app/services';
import { AssetInfo } from '@app/http';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _chainService: ChainService) {}

    getTokenSupply = async (): Promise<number> => {
        try {
            return Number(convertUnit(await this._lumNetworkService.client.getSupply(AssetMicroDenum.DFR), AssetDenum.DFR));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`, error);
            return null;
        }
    };

    getTotalComputedTvl = async (): Promise<any> => {
        try {
            return (await Promise.all([await this._chainService.getTvl(), await this._lumNetworkService.getTvl()]))
                .flat()
                .map((el) => el.tvl)
                .reduce((prev, next) => prev + next);
        } catch (error) {
            this._logger.error(`Could not fetch Computed TVL for DFR on Lum Network...`, error);
            return null;
        }
    };

    getTotalComputedApy = async (): Promise<any> => {
        try {
            return (await Promise.all([await this._chainService.getApy(), await this._lumNetworkService.getApy()]))
                .flat()
                .map((el) => el.apy)
                .reduce((prev, next) => prev + next);
        } catch (error) {
            this._logger.error(`Could not fetch Computed APY for DFR on Lum Network...`, error);
            return null;
        }
    };

    getCashInVault = async (): Promise<number> => {
        try {
            return Number((await this._lumNetworkService.client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;
        } catch (error) {
            this._logger.error(`Could not compute cash available in vault for DFR on Lum Network...`, error);
        }
    };

    getNewDfrToMint = async (): Promise<number> => {
        try {
            return await Promise.all([Number(await this.getTokenSupply()), Number(await this.getCashInVault()), Number(await this.getTotalComputedTvl())]).then(
                ([supply, accountBalance, computedTvl]) => (supply * accountBalance) / computedTvl,
            );
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`, error);
            return null;
        }
    };

    getDfrMintRatio = async (): Promise<number> => {
        try {
            return await Promise.all([Number(await this.getNewDfrToMint()), Number(await this.getTotalComputedTvl()), Number(await this.getTokenSupply())]).then(
                ([dfrToMint, computedTvl, tokenSupply]) => (dfrToMint + tokenSupply) / computedTvl,
            );
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR on Lum Network...`, error);
            return null;
        }
    };

    getDfrBackingPrice = async (): Promise<number> => {
        try {
            return 1 / Number(await this.getDfrMintRatio());
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price for DFR on Lum Network...`, error);
            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            return await Promise.all([Number(await this.getDfrBackingPrice()), Number(await this.getTokenSupply())]).then(([dfrToMintPrice, supply]) => dfrToMintPrice * supply);
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap on Lum Network...`, error);
            return null;
        }
    };

    getApy = async (): Promise<number> => {
        try {
            // We compute the apy from DFR based on the following formula
            // (token tvl (price * token amount) * token apy) / total computed tvl
            return await Promise.all([
                await this._chainService.getTvl(),
                await this._lumNetworkService.getTvl(),
                await this._chainService.getApy(),
                await this._lumNetworkService.getApy(),
                await this.getTotalComputedTvl(),
            ]).then(([chainServiceTvl, lumTvl, chainServiceApy, lumApy, computedTvl]) => {
                const tvl = [...chainServiceTvl, lumTvl];
                const apy = [...chainServiceApy, lumApy];
                const merged = tvl
                    .map((item, i) => Object.assign({}, item, apy[i]))
                    .map((el) => Number(el.apy) * Number(el.tvl))
                    .reduce((prev, next) => prev + next);

                return merged / computedTvl;
            });
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`, error);
            return null;
        }
    };

    getAssetInfo = async (): Promise<AssetInfo> => {
        try {
            const getAvailableCash = await this.getCashInVault();
            console.log('getAvailableCash', getAvailableCash);
            return await Promise.all([await this.getDfrBackingPrice(), Number(await this.getMcap()), await this.getTokenSupply(), Number(await this.getApy())]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }),
            );
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract...', error);
            return null;
        }
    };
}
