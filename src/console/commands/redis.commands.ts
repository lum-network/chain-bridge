import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Command, Console } from 'nestjs-console';
import { Cache } from 'cache-manager';

@Console({ command: 'redis', description: 'Redis related commands' })
export class RedisCommands {
    constructor(@Inject(CACHE_MANAGER) private readonly _cacheManager: Cache) {}

    @Command({ command: 'clear', description: 'Clear the whole cache' })
    async clear(): Promise<void> {
        await this._cacheManager.reset();
        process.exit(0);
    }
}
