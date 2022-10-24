import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { AkashNetworkService, ComdexService, CosmosService, EvmosService, JunoService, KichainService, LumNetworkService, OsmosisService, SentinelService, StargazeService } from '@app/services';

@Injectable()
export class DfractScheduler {
    private _logger: Logger = new Logger(DfractScheduler.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _osmosisService: OsmosisService,
        private readonly _cosmosService: CosmosService,
        private readonly _junoService: JunoService,
        private readonly _evmosService: EvmosService,
        private readonly _comdexService: ComdexService,
        private readonly _stargazeService: StargazeService,
        private readonly _akashNetworkService: AkashNetworkService,
        private readonly _sentinelService: SentinelService,
        private readonly _kiChainService: KichainService,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async cosmosSync() {
        try {
            this._logger.log(`Syncing token assets info from Cosmos chain...`);

            const getTokenInfo = await this._cosmosService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Cosmsos chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async osmosisSync() {
        try {
            this._logger.log(`Syncing token assets info from Osmosis chain...`);

            const getTokenInfo = await this._osmosisService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Osmosis chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async junoSync() {
        try {
            this._logger.log(`Syncing token assets info from Osmosis chain...`);

            const getTokenInfo = await this._junoService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Osmosis chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async evmosSync() {
        try {
            this._logger.log(`Syncing token assets info from Evmos chain...`);

            const getTokenInfo = await this._evmosService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Evmos chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async lumSync() {
        try {
            this._logger.log(`Syncing token assets info from Lum Network chain...`);

            const getTokenInfo = await this._lumNetworkService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Lum Network chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async comdexSync() {
        try {
            this._logger.log(`Syncing token assets info from Comdex chain...`);

            const getTokenInfo = await this._comdexService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Comdex chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async stargazeSync() {
        try {
            this._logger.log(`Syncing token assets info from Stargaze chain...`);

            const getTokenInfo = await this._stargazeService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Stargaze chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async sentinelSync() {
        try {
            this._logger.log(`Syncing token assets info from Sentinel chain...`);

            const getTokenInfo = await this._sentinelService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Sentinel chain...`, error);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async kiChainSync() {
        try {
            this._logger.log(`Syncing token assets info from Kichain chain...`);

            const getTokenInfo = await this._kiChainService.getTokenInfo();
            if (getTokenInfo) console.log('getTokenInfo', getTokenInfo);
        } catch (error) {
            this._logger.error(`Failed to sync token assets from Kichain chain...`, error);
        }
    }
}
