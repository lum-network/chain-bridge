import { HttpModule } from '@nestjs/axios';
import { Module, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';

import { Queue } from 'bull';

import { BlockConsumer, CoreConsumer, NotificationConsumer } from '@app/async';

import { ElasticService, LumService, LumNetworkService } from '@app/services';
import { Queues, config } from '@app/utils';
import { GatewayWebsocket } from '@app/websocket';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: Queues.QUEUE_DEFAULT,
                redis: {
                    host: config.getRedisHost(),
                    port: config.getRedisPort(),
                },
                prefix: config.getRedisPrefix(),
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            },
            {
                name: Queues.QUEUE_FAUCET,
                redis: {
                    host: config.getRedisHost(),
                    port: config.getRedisPort(),
                },
                prefix: config.getRedisPrefix(),
                limiter: {
                    max: 1,
                    duration: 30,
                },
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            },
        ),
        HttpModule,
    ],
    controllers: [],
    providers: [BlockConsumer, CoreConsumer, GatewayWebsocket, NotificationConsumer, ElasticService, LumNetworkService, LumService],
})
export class SyncConsumerModule implements OnModuleInit, OnApplicationBootstrap {
    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService, @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {}

    async onModuleInit() {
        // Make sure to initialize the lum network service
        await this._lumNetworkService.initialise();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }
    }
}
