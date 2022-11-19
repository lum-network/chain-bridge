import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { AssetService, ChainService, DfractService, LumNetworkService } from '@app/services';
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
    async syncValue(): Promise<void> {
        try {
            this._logger.log(`Syncing latest assets info from chain...`);
            // We sync all values except DFR every hour by starting with LUM
            // Data we get {unit_price_usd, total_value_usd, supply, apy, total_allocated_token}
            // We want to start syncing lum before moving to other chains

            const lumMetrics = await this._lumNetworkService.getAssetInfo();
            if (lumMetrics) {
                this._assetService.ownAssetCreateOrUpdateValue(lumMetrics, AssetSymbol.LUM);
            }

            const chainMetrics = await this._chainService.getAssetInfo();
            if (chainMetrics) {
                this._assetService.chainAssetCreateOrUpdateValue(chainMetrics);
            }
        } catch (error) {
            this._logger.error(`Failed to update hourly asset info...`, error);
        }
    }

    @Cron(CronExpression.EVERY_WEEK)
    async syncExtraWeekly(): Promise<void> {
        try {
            // We only update chain values other than DFR once a week

            this._logger.log(`Updating historical info from index assets...`);

            // We append historical data to be able to compute trends
            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to update weekly historical data...`, error);
        }
    }

    // Every 15 minutes, between 12:00 PM and 05:59 PM, only on Monday
    @Cron('0 */15 12-17 * * 1')
    async syncDfr(): Promise<void> {
        try {
            this._logger.log(`Updating DFR token values from chain...`);

            // We only update DFR values once every epoch
            const [dfractMetrics, availableBalance] = await Promise.all([this._dfractService.getAssetInfo(), this._dfractService.getCashInVault()]);

            if (dfractMetrics && availableBalance > 0) {
                this._assetService.ownAssetCreateOrUpdateValue(dfractMetrics, AssetSymbol.DFR);
            }
        } catch (error) {
            this._logger.error(`Failed to update DFR token values from chain...`, error);
        }
    }

    // Cron that makes sure that the weekly historical data gets properly populated in case of failure
    // Runs every 2 hours
    @Cron(CronExpression.EVERY_2_HOURS)
    async retrySync(): Promise<void> {
        try {
            this._logger.log(`Verifying missing historical data...`);
            const arr = [];

            const record = await this._assetService.getExtra();

            // For every metrics we want to check the last inserted extra value
            for (const key of record) {
                arr.push({ id: key?.id, extra: key?.extra?.pop() });
            }

            // As we update historical data one time per epoch we verify if the last updated record was inserted during that week time
            // If not we retry
            const today = new Date();
            const firstWeekDay = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
            const lastWeekDay = new Date(today.setDate(today.getDate() - today.getDay() + 7)).toISOString();

            for (const el of arr) {
                const isUpdated = new Date(el?.extra?.last_updated_at) >= new Date(firstWeekDay) && new Date(el?.extra?.last_updated_at) <= new Date(lastWeekDay);

                if (!isUpdated) {
                    // Wait for all the call to finish before createOrUpdateAssetExtra
                    this._assetService.createOrUpdateAssetExtra(el.id);
                    this._logger.log(`Updated failed sync historical data for ${el.id}`);
                }
            }
        } catch (error) {
            this._logger.error(`Failed to resync weekly historical data...`, error);
        }
    }
}
