import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import * as Sentry from '@sentry/node';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { AssetService, ChainService, DfractService, ProposalService } from '@app/services';
import { LUM_DFR_ALLOCATION_TYPE_URL } from '@app/utils';
import dayjs from 'dayjs';

@Injectable()
export class AssetScheduler {
    private _logger: Logger = new Logger(AssetScheduler.name);

    constructor(
        private readonly _assetService: AssetService,
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _dfractService: DfractService,
        private readonly _proposalService: ProposalService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_5AM)
    async dailySyncValues(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing latest assets info from chain...`);

        try {
            const chainMetrics = await this._chainService.getAssetInfo();
            if (chainMetrics && chainMetrics.length > 0) {
                await this._assetService.createFromInfo(chainMetrics.filter((metric) => metric.symbol !== 'DFR'));
            }
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
        }
    }

    // Every 10 minutes, between 08:00 am and 05:59 PM, only on Monday
    @Cron('0 */10 08-17 * * 1')
    async weeklySyncValues(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Updating DFR token values...`);

        try {
            // We only update DFR values once every epoch
            const [preGovPropMetrics, postGovPropMetrics, proposals] = await Promise.all([
                this._dfractService.getAssetInfoPreGovProp(),
                this._dfractService.getAssetInfoPostGovProp(),
                this._proposalService.fetchType(LUM_DFR_ALLOCATION_TYPE_URL),
            ]);

            const now = dayjs();
            const votingEndTime = dayjs(proposals[0].voting_end_time);
            const isVotingEndTimeToday = dayjs(votingEndTime).isSame(now.startOf('day'), 'day');
            const diff = votingEndTime.diff(now, 'minute');
            // Cron is running every 10min, if less or equal than 10 than update
            const votingEndTimeSoonReached = Math.abs(diff) <= 10;

            // Verify if proposals is not empty and the voting endTime is today
            if (!proposals.length || !isVotingEndTimeToday) {
                return;
            }

            // Check if the gov prop is ongoing or passed
            const isGovPropOngoing = proposals[0].status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;
            const isGovPropPassed = proposals[0].status === ProposalStatus.PROPOSAL_STATUS_PASSED;

            // If there is cash in the account balance, non-falsy dfractMetrics and an ongoing dfr gov prop, we update the records
            // Pre gov prop asset info {account_balance, tvl}
            if (preGovPropMetrics && preGovPropMetrics.account_balance > 0 && isGovPropOngoing && votingEndTimeSoonReached) {
                await this._assetService.create(`dfr_account_balance`, String(preGovPropMetrics.account_balance));
                await this._assetService.create(`dfr_tvl`, String(preGovPropMetrics.tvl));
                // If the gov prop has passed and has non-falsy dfractMetrics we update the records to persist the remaining metrics
                // Post gov prop asset info {unit_price_usd, total_value_usd, supply, apy}
            } else if (postGovPropMetrics && isGovPropPassed) {
                (await this._assetService.isKeyCreated('dfr_unit_price_usd')) && (await this._assetService.create(`dfr_unit_price_usd`, String(postGovPropMetrics.unit_price_usd)));
                (await this._assetService.isKeyCreated('dfr_total_value_usd')) && (await this._assetService.create(`dfr_total_value_usd`, String(postGovPropMetrics.total_value_usd)));
                (await this._assetService.isKeyCreated('dfr_supply')) && (await this._assetService.create(`dfr_supply`, String(postGovPropMetrics.supply)));
                (await this._assetService.isKeyCreated('dfr_apy')) && (await this._assetService.create(`dfr_apy`, String(postGovPropMetrics.apy)));
            }
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
        }
    }
}
