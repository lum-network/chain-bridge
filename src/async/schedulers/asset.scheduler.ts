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

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncHourly() {
        try {
            this._logger.log(`Syncing latest token values from chain...`);
            // We sync all values except DFR every hour
            // Data we get {unit_price_usd, total_value_usd, supply, apy}

            const chainMetrics = await this._chainService.getTokenInfo();
            if (chainMetrics) this._assetService.chainAssetCreateOrUpdateValue(chainMetrics);

            const lumMetrics = await this._lumNetworkService.getTokenInfo();
            if (lumMetrics) this._assetService.owneAssetCreateOrUpdateValue(lumMetrics, AssetSymbol.LUM);
        } catch (error) {
            this._logger.error(`Failed to update hourly values...`, error);
        }
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async syncWeekly() {
        try {
            this._logger.log(`Updating DFR token values from chain...`);

            const dfractMetrics = await this._dfractService.getTokenInfo();
            if (dfractMetrics) this._assetService.owneAssetCreateOrUpdateValue(dfractMetrics, AssetSymbol.DFR);

            this._logger.log(`Updating historical value from index assets...`);

            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to update weekly historical data...`, error);
        }
    }
}
