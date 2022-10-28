import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { ChainService, DfractService, LumNetworkService } from '@app/services';
import { AssetService } from '@app/services/asset.service';
import { AssetSymbol } from '@app/utils';

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
            this._logger.log(`Syncing token assets info from chain...`);

            const getMetrics = await this._chainService.getTokenInfo();

            if (getMetrics) await this._assetService.chainAssetCreateOrUpdate(getMetrics);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from External chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async lumNetworkSync() {
        try {
            this._logger.log(`Syncing token assets info from LumNetwork chain...`);

            const tokenInfo = await this._lumNetworkService.getTokenInfo();

            if (tokenInfo) await this._assetService.owneAssetCreateOrUpdate(tokenInfo, AssetSymbol.LUM);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from LumNetwork chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async dfractSync() {
        try {
            this._logger.log(`Syncing token assets info from LumNetwork chain for Dfract...`);

            const tokenInfo = await this._dfractService.getTokenInfo();

            if (tokenInfo) await this._assetService.owneAssetCreateOrUpdate(tokenInfo, AssetSymbol.DFR);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from LumNetwork chain for Dfract...`, error);
        }
    }
}
