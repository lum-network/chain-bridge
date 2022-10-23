import { DfractAssetName, DfractAssetSymbol } from '@app/utils';
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

    getTotalComputedTvl = async (): Promise<[number]> => {
        try {
            const getTvl = Promise.all([
                (await this._cosmosService.getTvl()) +
                    (await this._osmosisService.getTvl()) +
                    (await this._junoService.getTvl()) +
                    (await this._evmosService.getTvl()) +
                    (await this._lumNetworkService.getTvl()) +
                    (await this._comdexService.getTvl()) +
                    (await this._stargazeService.getTvl()) +
                    (await this._akashNetworkService.getTvl()) +
                    (await this._sentinelService.getTvl()) +
                    (await this._kiChainService.getTvl()),
            ]);

            return getTvl;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for DFR on Lum Network...`);
        }
    };

    getDfrMintRatio = async (): Promise<[number]> => {
        try {
            const ratio = Promise.all([(await this.getTokenSupply()) / Number(await this.getTotalComputedTvl())]);

            return ratio;
        } catch (error) {
            this._logger.error(`Could not compute Dfr To Mint Ratio for DFR on Lum Network...`);
        }
    };

    getDfrToMintPrice = async (): Promise<number> => {
        try {
            const price = 1 / Number(await this.getDfrMintRatio());

            return price;
        } catch (error) {
            this._logger.error(`Could not compute new DFR backing price on Lum Network...`);
        }
    };

    getMcap = async (): Promise<[number]> => {
        try {
            const mcap = Promise.all([(await this.getDfrToMintPrice()) * (await this.getTokenSupply())]);

            return mcap;
        } catch (error) {
            this._logger.error(`Could not compute new DFR Market Cap on Lum Network...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const apy = null;

            return apy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Dfract...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getTokenInfo = await Promise.all([await this.getDfrToMintPrice(), Number(await this.getMcap()), await this.getTokenSupply(), await this.getApy()]).then(
                ([unitPriceUsd, totalValueUsd, supply, apy]) => ({ unitPriceUsd, totalValueUsd, supply, apy }),
            );

            return {
                name: DfractAssetName.DFR,
                symbol: DfractAssetSymbol.DFR,
                ...getTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Dfract...', error);
        }
    };
}
