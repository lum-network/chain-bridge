import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { ChainService, DfractService, LumNetworkService } from '@app/services';
import { AssetService } from '@app/services/asset.service';

@Injectable()
export class AssetScheduler {
    private _logger: Logger = new Logger(AssetScheduler.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _assetService: AssetService,
        private readonly _dfractService: DfractService,
        private readonly _chainService: ChainService,
    ) {}

    // Each scheduler is launched in parallel in fetch the token info from the respective chains
    @Cron(CronExpression.EVERY_10_SECONDS)
    async chainSync() {
        try {
            this._logger.log(`Syncing token assets info from External chain...`);

            /* const name = AssetName.COSMOS; */
            const tokenInfo = (await this._chainService.getTokenInfo()).sort((a, b) => a.symbol.localeCompare(b.symbol));

            if (tokenInfo) await this._assetService.genericAsset(tokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Cosmsos chain...`, error);
            return null;
        }
    }

    /*     @Cron(CronExpression.EVERY_10_SECONDS)
    async lumNetworkSync() {
        try {
            this._logger.log(`Syncing token assets info from Lum Network chain...`);

            const name = AssetName.LUM;

            const tokenInfo = await this._lumNetworkService.getTokenInfo().catch(() => null);

            if (tokenInfo) await this._assetService.genericAsset(tokenInfo, name);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Lum Network chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async dfractSync() {
        try {
            this._logger.log(`Syncing token assets info from LumNetwork chain for Dfract...`);

            const name = AssetName.DFR;

            const tokenInfo = await this._dfractService.getTokenInfo().catch(() => null);

            if (tokenInfo) await this._assetService.genericAsset(tokenInfo, name);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Kichain chain...`, error);
        }
    } */
}
