import { HttpModule } from '@nestjs/axios';
import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Queue } from 'bull';

import { BlockConsumer, CoreConsumer, NotificationConsumer } from '@app/async';

import {
    BlockService,
    ElasticService,
    LumNetworkService,
    LumService,
    TransactionService,
    ValidatorService
} from '@app/services';
import { config, Queues } from '@app/utils';

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
        ClientsModule.register([
            {
                name: 'API',
                transport: Transport.REDIS,
                options: {
                    url: config.getRedisURL(),
                },
            },
        ]),
        HttpModule,
    ],
    controllers: [],
    providers: [BlockService, TransactionService, ValidatorService, BlockConsumer, CoreConsumer, NotificationConsumer, ElasticService, LumNetworkService, LumService],
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
