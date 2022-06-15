import {CACHE_MANAGER, Inject} from "@nestjs/common";

import {Command, Console, createSpinner} from "nestjs-console";

import { Cache } from 'cache-manager';

@Console({command: 'redis', description: 'Redis related commands'})
export class RedisCommands {
    constructor(
        @Inject(CACHE_MANAGER) private readonly _cacheManager: Cache
    ) {
    }

    @Command({command: 'clear', description: 'Clear the whole cache'})
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the cache...');
        await this._cacheManager.reset();
        spin.succeed('Cache cleared');
        process.exit(0);
    }
}
