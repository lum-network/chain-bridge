import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { AssetService, ChainService, DfractService, ProposalService } from '@app/services';
import { LUM_DFR_ALLOCATION_TYPE_URL } from '@app/utils';

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
                await this._assetService.createFromInfo(chainMetrics);
            }
        } catch (e) {
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

        // We only update DFR values once every epoch
        const [preGovPropDfractMetrics, accountBalance, postGovPropDfractMetrics, proposals] = await Promise.all([
            this._dfractService.getAssetInfoPreGovProp(),
            this._dfractService.getAccountBalance(),
            this._dfractService.getAssetInfoPostGovProp(),
            this._proposalService.fetch(),
        ]);

        const lastProposal = proposals[0];
        if (lastProposal.type_url !== LUM_DFR_ALLOCATION_TYPE_URL) {
            return;
        }

        const isGovPropDfractOngoing = lastProposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;
        const isGovPropDfractPassed = lastProposal.status === ProposalStatus.PROPOSAL_STATUS_PASSED;

        /*// If there is cash in the account balance, non-falsy dfractMetrics and an ongoing dfr gov prop, we update the records
        // Pre gov prop asset info {account_balance, tvl}
        if (preGovPropDfractMetrics && accountBalance > 0 && isGovPropDfractOngoing) {
            await this._assetService.ownAssetCreateOrUpdateValue(preGovPropDfractMetrics, AssetSymbol.DFR);
            // If the gov prop has passed and has non-falsy dfractMetrics we update the records to persist the remaining metrics
            // Post gov prop asset info {unit_price_usd, total_value_usd, supply, apy}
        } else if (postGovPropDfractMetrics && isGovPropDfractPassed) {
            await this._assetService.ownAssetCreateOrUpdateValue(postGovPropDfractMetrics, AssetSymbol.DFR);
        }*/
    }
}
