import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { AssetService, ChainService, DfractService, LumNetworkService } from '@app/services';
import { AssetSymbol, LUM_DFR_ALLOCATION } from '@app/utils';

@Injectable()
export class AssetScheduler {
    private _logger: Logger = new Logger(AssetScheduler.name);

    constructor(
        private readonly _assetService: AssetService,
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _dfractService: DfractService,
        private readonly _lumNetworkService: LumNetworkService,
    ) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncValue(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }
        try {
            this._logger.log(`Syncing latest assets info from chain...`);
            // We sync all values except DFR every hour by starting with LUM
            // Data we get {unit_price_usd, total_value_usd, supply, apy, total_allocated_token}
            // We want to start syncing lum before moving to other chains

            const lumMetrics = await this._lumNetworkService.getAssetInfo();
            if (lumMetrics) {
                await this._assetService.ownAssetCreateOrUpdateValue(lumMetrics, AssetSymbol.LUM);
            }

            const chainMetrics = await this._chainService.getAssetInfo();
            if (chainMetrics) {
                await this._assetService.chainAssetCreateOrUpdateValue(chainMetrics);
            }
        } catch (error) {
            this._logger.error(`Failed to update hourly asset info...`, error);
        }
    }

    @Cron(CronExpression.EVERY_WEEK)
    async syncExtraWeekly(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        try {
            // We only update chain values other than DFR once a week

            this._logger.log(`Updating historical info from index assets...`);

            // We append historical data to be able to compute trends
            await this._assetService.assetCreateOrAppendExtra();
        } catch (error) {
            this._logger.error(`Failed to update weekly historical data...`, error);
        }
    }

    // Every 15 minutes, between 08:00 am and 05:59 PM, only on Monday
    @Cron('0 */15 08-17 * * 1')
    async syncDfr(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        try {
            this._logger.log(`Updating DFR token values from chain...`);

            // We only update DFR values once every epoch
            const [dfractMetrics, availableBalance, proposalResults] = await Promise.all([
                this._dfractService.getAssetInfo(),
                this._dfractService.getCashInVault(),
                this._lumNetworkService.getProposals(),
            ]);

            // To avoid edge cases we verify that the last gov prop is a Dfract allocation one and that the voting period is still ongoing
            // Check the last proposal
            const proposal = proposalResults.proposals.pop();
            // Verify that the last proposal is a DFR Allocation Proposal
            const isGovPropDfract = proposal.content.typeUrl.includes(LUM_DFR_ALLOCATION);
            // Verify that the status is ongoing
            const isGovPropDfractOngoing = proposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;

            // We only consider the cron if the last gov prop is a DFR gov prop
            if (isGovPropDfract) {
                // If there is cash in the account balance, non-falsy dfractMetrics and an ongoing dfr gov prop, we update the records
                if (dfractMetrics && availableBalance > 0 && isGovPropDfractOngoing) {
                    this._assetService.ownAssetCreateOrUpdateValue(dfractMetrics, AssetSymbol.DFR);
                }
            }
        } catch (error) {
            this._logger.error(`Failed to update DFR token values from chain...`, error);
        }
    }

    // Cron that makes sure that the weekly historical data gets properly populated in case of failure
    // Runs every 2 hours
    @Cron(CronExpression.EVERY_2_HOURS)
    async retrySync(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

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
