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

    @Cron(CronExpression.EVERY_WEEK)
    async syncHourly(): Promise<void> {
        try {
            this._logger.log(`Syncing latest token values from chain...`);
            // We sync all values except DFR every hour by starting with LUM
            // Data we get {unit_price_usd, total_value_usd, supply, apy}

            const lumMetrics = await this._lumNetworkService.getTokenInfo();
            if (lumMetrics) this._assetService.owneAssetCreateOrUpdateValue(lumMetrics, AssetSymbol.LUM);

            const chainMetrics = await this._chainService.getTokenInfo();
            if (chainMetrics) this._assetService.chainAssetCreateOrUpdateValue(chainMetrics);
        } catch (error) {
            this._logger.error(`Failed to update hourly values...`, error);
        }
    }

    // Every Monday at noon
    @Cron('0 0 12 * * 1,0')
    async syncWeekly(): Promise<void> {
        try {
            this._logger.log(`Updating DFR token values from chain...`);

            // We only update DFR values once every epoch
            const dfractMetrics = await this._dfractService.getTokenInfo();
            if (dfractMetrics) this._assetService.owneAssetCreateOrUpdateValue(dfractMetrics, AssetSymbol.DFR);

            this._logger.log(`Updating historical value from index assets...`);

            // We append historical data to being compute trends
            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to update weekly historical data...`, error);
        }
    }

    // Cron that makes sure that the weekly historical data gets properly populated in case of failure
    @Cron(CronExpression.EVERY_HOUR)
    async retrySync(): Promise<void> {
        try {
            this._logger.log(`Verifying missing historical data...`);
            const arr = [];

            const record = await this._assetService.getExtra();

            // For every metrics we want to check the last inserted extra value
            for (const key of record) {
                arr.push({ id: key?.id, extra: key?.extra?.pop() });
            }

            // As we update historical data one time per epoch we verify if the last updated record was inserted during that time
            // If not we retry
            const today = new Date();
            const firstWeekDay = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
            const lastWeekDay = new Date(today.setDate(today.getDate() - today.getDay() + 7)).toISOString();

            arr.forEach((el) => {
                const isUpdated = new Date(el?.extra?.last_updated_at) >= new Date(firstWeekDay) && new Date(el?.extra?.last_updated_at) <= new Date(lastWeekDay);

                if (!isUpdated) {
                    this._assetService.createOrUpdateAssetExtra(el.id);
                    this._logger.log(`Updated failed syncronized historical data for ${el.id}`);
                }
            });
        } catch (error) {
            this._logger.error(`Failed to update weekly historical data...`, error);
        }
    }
}
