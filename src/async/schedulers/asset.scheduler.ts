import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';

import { Queue } from 'bull';

import { QueueJobs, QueuePriority, Queues } from '@app/utils';

@Injectable()
export class AssetScheduler {
    constructor(
        @InjectQueue(Queues.ASSETS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
    ) {}

    // Every 10 minutes, every day, between 05:00 am and 05:59 PM
    @Cron('0 */10 05-17 * * *')
    async dailySyncValues(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        await this._queue.add(
            QueueJobs.PROCESS_DAILY,
            {},
            {
                priority: QueuePriority.URGENT,
            },
        );
    }

    // Every 10 minutes, between 08:00 am and 05:59 PM, only on Monday
    @Cron('0 */10 08-17 * * 1')
    async weeklySyncValues(): Promise<void> {
        if (!this._configService.get<boolean>('DFRACT_SYNC_ENABLED')) {
            return;
        }

        await this._queue.add(
            QueueJobs.PROCESS_WEEKLY,
            {},
            {
                priority: QueuePriority.URGENT,
            },
        );
    }
}
