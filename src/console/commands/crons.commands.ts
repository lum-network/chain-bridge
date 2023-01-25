import { Command, Console } from 'nestjs-console';

import { AssetScheduler } from '@app/async';

@Console({ command: 'crons', description: 'Crons related commands' })
export class CronsCommands {
    constructor(private readonly _assetScheduler: AssetScheduler) {}

    @Command({ command: 'asset-sync-dfr', description: 'Sync DFR values' })
    async assetSyncDfr(): Promise<void> {
        await this._assetScheduler.syncDfr();
        process.exit(0);
    }
}
