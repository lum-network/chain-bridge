import { Command, Console } from 'nestjs-console';

import { AssetScheduler } from '@app/async';

@Console({ command: 'crons', description: 'Crons related commands' })
export class CronsCommands {
    constructor(private readonly _assetScheduler: AssetScheduler) {}

    @Command({ command: 'asset-daily-sync', description: 'Daily sync values' })
    async assetSyncDaily(): Promise<void> {
        await this._assetScheduler.dailySyncValues();
        process.exit(0);
    }

    @Command({ command: 'asset-weekly-sync', description: 'Weekly sync values' })
    async assetSyncWeekly(): Promise<void> {
        await this._assetScheduler.weeklySyncValues();
        process.exit(0);
    }
}
