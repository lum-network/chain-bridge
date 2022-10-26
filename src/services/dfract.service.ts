import { TEN_EXPONENT_SIX } from '@app/utils';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { Injectable, Logger } from '@nestjs/common';
import { LumNetworkService, OsmosisService, CosmosService, JunoService, EvmosService, ComdexService, StargazeService, AkashNetworkService, SentinelService, KichainService } from '@app/services';
import { TokenInfo } from '@app/http';

@Injectable()
export class DfractService {
    private readonly _logger: Logger = new Logger(DfractService.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _osmosisService: OsmosisService,
        private readonly _cosmosService: CosmosService,
        private readonly _junoService: JunoService,
        private readonly _evmosService: EvmosService,
        private readonly _comdexService: ComdexService,
        private readonly _stargazeService: StargazeService,
        private readonly _akashNetworkService: AkashNetworkService,
        private readonly _sentinelService: SentinelService,
        private readonly _kiChainService: KichainService,
    ) {}

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this._lumNetworkService.client.getSupply('udfr'), 'dfr'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`);
        }
    };

    getTotalComputedTvl = async (): Promise<number> => {
        try {
            const getTvl = Promise.all([
                await this._cosmosService.getTvl(),
                await this._osmosisService.getTvl(),
                await this._junoService.getTvl(),
                await this._evmosService.getTvl(),
                await this._lumNetworkService.getTvl(),
                await this._comdexService.getTvl(),
                await this._stargazeService.getTvl(),
                await this._akashNetworkService.getTvl(),
                await this._sentinelService.getTvl(),
                await this._kiChainService.getTvl(),
            ])
                .then((tvl) => tvl.reduce((prev, next) => prev + next))
                .catch(() => null);

            return getTvl;
        } catch (error) {
            this._logger.error(`Could not fetch Computed TVL for DFR on Lum Network...`);
        }
    };

    getTotalComputedApy = async (): Promise<number> => {
        try {
            const getTotalApy = Promise.all([
                await this._cosmosService.getApy(),
                await this._osmosisService.getApy(),
                await this._junoService.getApy(),
                await this._evmosService.getApy(),
                await this._lumNetworkService.getApy(),
                await this._comdexService.getApy(),
                await this._stargazeService.getApy(),
                await this._akashNetworkService.getApy(),
                await this._sentinelService.getApy(),
                await this._kiChainService.getApy(),
            ])
                .then((apy) => apy.reduce((prev, next) => prev + next))
                .catch(() => null);

            return getTotalApy;
        } catch (error) {
            this._logger.error(`Could not fetch Computed APY for DFR on Lum Network...`);
        }
    };

    getCashInVault = async (): Promise<number> => {
        try {
            const balance = Number((await this._lumNetworkService.client.queryClient.dfract.getAccountBalance()).map((el) => el.amount)) / TEN_EXPONENT_SIX || 0;

            return balance;
        } catch (error) {
            this._logger.error(`Could not compute cash available in vault for DFR on Lum Network...`);
        }
    };

    getNewDfrToMint = async (): Promise<number> => {
        try {
            const ratio = Promise.all([Number(await this.getTokenSupply()), Number(await this.getCashInVault()), Number(await this.getTotalComputedTvl())])
                .then(([supply, accountBalance, computedTvl]) => (supply * accountBalance) / computedTvl)
                .catch(() => null);

            return ratio;
        } catch (error) {
            this._logger.error(`Could not compute new Dfr To Mint for DFR on Lum Network...`);
        }
    };

    getDfrMintRatio = async (): Promise<number> => {
        try {
            const ratio = Promise.all([Number(await this.getNewDfrToMint()), Number(await this.getCashInVault())])
                .then(([dfrToMint, accountBalance]) => dfrToMint / accountBalance)
                .catch(() => null);

            return ratio;
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR on Lum Network...`);
        }
    };

    getDfrBackingPrice = async (): Promise<number> => {
        try {
            const price = 1 / Number(await this.getDfrMintRatio());

            return price;
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price for DFR on Lum Network...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const mcap = Promise.all([Number(await this.getDfrBackingPrice()), Number(await this.getTokenSupply())])
                .then(([dfrToMintPrice, supply]) => dfrToMintPrice * supply)
                .catch(() => null);

            return mcap;
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap on Lum Network...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const apy = Promise.all([Number(await this.getTotalComputedTvl()), Number(await this.getTotalComputedApy()), Number(await this.getTotalComputedTvl())])
                .then(([computedTvl, computedApy]) => (computedTvl + computedApy) / computedTvl)
                .catch(() => null);

            return apy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getDfrBackingPrice(), Number(await this.getMcap()), await this.getTokenSupply(), Number(await this.getApy())])
                .then(([unit_price_usd, total_value_usd, supply, apy]) => ({ unit_price_usd, total_value_usd, supply, apy }))
                .catch(() => null);

            return {
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract...', error);
        }
    };
}
