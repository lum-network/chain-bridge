import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { ChainService, DfractService, LumNetworkService } from '@app/services';
import { AssetService } from '@app/services/asset.service';
import { AssetSymbol } from '@app/utils';
import moment from 'moment';

@Injectable()
export class AssetScheduler {
    private _logger: Logger = new Logger(AssetScheduler.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _assetService: AssetService,
        private readonly _dfractService: DfractService,
        private readonly _chainService: ChainService,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async syncValue() {
        try {
            this._logger.log(`Syncing latest token info values from chain...`);

            const chainMetrics = await this._chainService.getTokenInfo();
            if (chainMetrics.length) this._assetService.chainAssetCreateOrUpdateValue(chainMetrics);

            const lumMetrics = await this._lumNetworkService.getTokenInfo();
            if (lumMetrics) this._assetService.owneAssetCreateOrUpdateValue(lumMetrics, AssetSymbol.LUM);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from External chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncExtra() {
        try {
            this._logger.log(`Querying latest value from assets table...`);

            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to query latest value from assets table...`, error);
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async dfractSync() {
        try {
            this._logger.log(`Syncing token assets info from LumNetwork chain for Dfract...`);

            const dfractMetrics = await this._dfractService.getTokenInfo();
            if (dfractMetrics) this._assetService.owneAssetCreateOrUpdateValue(dfractMetrics, AssetSymbol.DFR);

            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to sync token assets from LumNetwork chain for Dfract...`, error);
        }
    }
}
