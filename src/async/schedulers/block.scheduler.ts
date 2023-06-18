import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Queue } from 'bull';

import { ChainService } from '@app/services';
import { AssetSymbol, QueueJobs, QueuePriority, Queues } from '@app/utils';

@Injectable()
export class BlockScheduler {
    constructor(@InjectQueue(Queues.BLOCKS) private readonly _queue: Queue, private readonly _configService: ConfigService, private readonly _chainService: ChainService) {}

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'blocks_backward_ingest' })
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const chainId = this._chainService.getChain(AssetSymbol.LUM).chainId;
        const blockHeight = await this._chainService.getChain(AssetSymbol.LUM).client.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: blockHeight,
            },
            {
                priority: QueuePriority.LOW,
            },
        );
    }
}
