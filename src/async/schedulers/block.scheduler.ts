import {Injectable, Logger} from '@nestjs/common';
import {InjectQueue} from '@nestjs/bull';
import {ConfigService} from "@nestjs/config";
import {Cron, CronExpression} from '@nestjs/schedule';

import {Queue} from 'bull';

import {LumNetworkService} from '@app/services';
import {QueueJobs, Queues} from '@app/utils';

@Injectable()
export class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    constructor(@InjectQueue(Queues.QUEUE_BLOCKS) private readonly _queue: Queue, private readonly _configService: ConfigService, private readonly _lumNetworkService: LumNetworkService) {
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, {name: 'blocks_backward_ingest'})
    async backwardIngest() {
        // Daily check that we did not miss a block sync somehow
        const chainId = await this._lumNetworkService.client.getChainId();
        const blockHeight = await this._lumNetworkService.client.getBlockHeight();
        await this._queue.add(QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD, {
            chainId: chainId,
            fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
            toBlock: blockHeight,
        });
    }
}
