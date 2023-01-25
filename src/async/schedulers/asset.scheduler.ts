import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { AssetService, ChainService, DfractService } from '@app/services';
import { AssetSymbol, LUM_DFR_ALLOCATION } from '@app/utils';
import { LumChain } from '@app/services/chains';

@Injectable()
export class AssetScheduler {
    private _logger: Logger = new Logger(AssetScheduler.name);

    constructor(
        private readonly _assetService: AssetService,
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
        private readonly _dfractService: DfractService,
    ) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncValue(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing latest assets info from chain...`);

        const chainMetrics = await this._chainService.getAssetInfo();
        if (chainMetrics && chainMetrics.length > 0) {
            await this._assetService.createOrUpdateFromInfo(chainMetrics);
        }
    }

    // Every Monday at 06:30pm
    // We align the sync extra with the end of the DFR sync cron
    @Cron('30 18 * * 1')
    async syncExtraWeekly(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Updating historical info from index assets...`);
        await this._assetService.createOrAppendExtra();
    }

    // Every 10 minutes, between 08:00 am and 05:59 PM, only on Monday
    @Cron('0 */10 08-17 * * 1')
    async syncDfr(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            //return;
        }

        this._logger.log(`Updating DFR token values...`);

        // We only update DFR values once every epoch
        const [preGovPropDfractMetrics, accountBalance, postGovPropDfractMetrics, proposalResults] = await Promise.all([
            this._dfractService.getAssetInfoPreGovProp(),
            this._dfractService.getAccountBalance(),
            this._dfractService.getAssetInfoPostGovProp(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getProposals(),
        ]);

        // Check the last proposal
        /*const proposal = proposalResults.proposals.pop();
        // Verify that the last proposal is a DFR Allocation Proposal
        console.log(proposal);
        const isGovPropDfract = proposal.content.typeUrl === LUM_DFR_ALLOCATION;
        // Verify that the status is ongoing for pre gov prop update
        const isGovPropDfractOngoing = proposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;
        // Verify that the status is passed for post gov prop update
        const isGovPropDfractPassed = proposal.status === ProposalStatus.PROPOSAL_STATUS_PASSED;

        // We only consider the cron if the last gov prop is a DFR allocation gov prop
        if (isGovPropDfract) {
            // If there is cash in the account balance, non-falsy dfractMetrics and an ongoing dfr gov prop, we update the records
            // Pre gov prop asset info {account_balance, tvl}
            if (preGovPropDfractMetrics && accountBalance > 0 && isGovPropDfractOngoing) {
                await this._assetService.ownAssetCreateOrUpdateValue(preGovPropDfractMetrics, AssetSymbol.DFR);
                // If the gov prop has passed and has non-falsy dfractMetrics we update the records to persist the remaining metrics
                // Post gov prop asset info {unit_price_usd, total_value_usd, supply, apy}
            } else if (postGovPropDfractMetrics && isGovPropDfractPassed) {
                await this._assetService.ownAssetCreateOrUpdateValue(postGovPropDfractMetrics, AssetSymbol.DFR);
            }
        }*/
    }
}
