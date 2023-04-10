import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import dayjs from 'dayjs';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { hasFalsyProperties, LUM_DFR_ALLOCATION_TYPE_URL, QueueJobs, Queues } from '@app/utils';
import { AssetService, ChainService, DfractService, ProposalService } from '@app/services';

@Processor(Queues.ASSETS)
export class AssetConsumer {
    private readonly _logger: Logger = new Logger(AssetConsumer.name);

    constructor(
        private readonly _assetService: AssetService,
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _dfractService: DfractService,
        private readonly _proposalService: ProposalService,
    ) {}

    @Process(QueueJobs.PROCESS_DAILY)
    async processDailySync() {
        this._logger.log(`Syncing latest assets info from chain...`);

        const chainMetrics = await this._chainService.getAssetInfo();
        const filteredMetrics = chainMetrics.filter((metric) => metric.symbol !== 'DFR');

        if (chainMetrics && chainMetrics.length > 0 && !hasFalsyProperties(filteredMetrics)) {
            await this._assetService.createFromInfo(filteredMetrics);
        }
        this._logger.log(`Synced ${filteredMetrics.length} assets info from chain`);
    }

    @Process(QueueJobs.PROCESS_WEEKLY)
    async processWeeklySync() {
        this._logger.log(`Updating DFR token values...`);

        // We only update DFR values once every epoch
        const [preGovPropMetrics, postGovPropMetrics, proposals] = await Promise.all([
            this._dfractService.getAssetInfoPreGovProp(),
            this._dfractService.getAssetInfoPostGovProp(),
            this._proposalService.fetchType(LUM_DFR_ALLOCATION_TYPE_URL),
        ]);

        if (!proposals || !proposals.length) {
            this._logger.warn(`No proposals found for DFR allocation`);
            return;
        }

        const now = dayjs();
        const votingEndTime = dayjs(proposals[0].voting_end_time);
        const isVotingEndTimeToday = dayjs(votingEndTime).isSame(now.startOf('day'), 'day');

        if (!isVotingEndTimeToday) {
            return;
        }

        const diff = votingEndTime.diff(now, 'minute');
        // Cron is running every 10min, if less or equal than 10min than create
        const votingEndTimeSoonReached = Math.abs(diff) <= 10;

        // Check if the gov prop is ongoing or passed
        const isGovPropOngoing = proposals[0].status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;
        const isGovPropPassed = proposals[0].status === ProposalStatus.PROPOSAL_STATUS_PASSED;
        const isAccBalanceCreated = !(await this._assetService.isNewKey('dfr_account_balance'));
        const isTvlCreated = !(await this._assetService.isNewKey('dfr_tvl'));

        // If there is cash in the account balance, non-falsy dfractMetrics and an ongoing dfr gov prop, we update the records
        // Pre gov prop asset info {account_balance, tvl}
        if (preGovPropMetrics && preGovPropMetrics.account_balance > 0 && isGovPropOngoing && votingEndTimeSoonReached) {
            await this._assetService.create(`dfr_account_balance`, String(preGovPropMetrics.account_balance));
            await this._assetService.create(`dfr_tvl`, String(preGovPropMetrics.tvl));
            // If the gov prop has passed and has non-falsy dfractMetrics we update the records to persist the remaining metrics
            // Post gov prop asset info {unit_price_usd, total_value_usd, supply, apy}
            // Only create if key is not created for the day
        } else if (postGovPropMetrics && isGovPropPassed && isAccBalanceCreated && isTvlCreated) {
            (await this._assetService.isNewKey('dfr_unit_price_usd')) && (await this._assetService.create(`dfr_unit_price_usd`, String(postGovPropMetrics.unit_price_usd)));
            (await this._assetService.isNewKey('dfr_total_value_usd')) && (await this._assetService.create(`dfr_total_value_usd`, String(postGovPropMetrics.total_value_usd)));
            (await this._assetService.isNewKey('dfr_supply')) && (await this._assetService.create(`dfr_supply`, String(postGovPropMetrics.supply)));
            (await this._assetService.isNewKey('dfr_apy')) && (await this._assetService.create(`dfr_apy`, String(postGovPropMetrics.apy)));
        }

        this._logger.log(`Updated DFR token values`);
    }
}
