import {HttpModule} from '@nestjs/axios';
import {Logger, Module, OnModuleInit, OnApplicationBootstrap} from '@nestjs/common';
import {BullModule, InjectQueue} from '@nestjs/bull';
import {ScheduleModule} from '@nestjs/schedule';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {ConfigModule, ConfigService} from "@nestjs/config";
import * as Joi from "joi";

import {Queue} from 'bull';

import {BlockScheduler, ValidatorScheduler} from '@app/async';

import {
    LumNetworkService,
    BlockService,
    TransactionService,
    ValidatorService,
    BeamService, ValidatorDelegationService
} from '@app/services';
import {Queues, ConfigMap, QueueJobs} from '@app/utils';
import {databaseProviders} from "@app/database";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.registerQueueAsync({
                name: Queues.QUEUE_BLOCKS,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT')
                    },
                    prefix: configService.get<string>('REDIS_PREFIX'),
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                })
            },
            {
                name: Queues.QUEUE_BEAMS,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT')
                    },
                    prefix: configService.get<string>('REDIS_PREFIX'),
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                })
            },
            {
                name: Queues.QUEUE_FAUCET,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT')
                    },
                    prefix: configService.get<string>('REDIS_PREFIX'),
                    limiter: {
                        max: 1,
                        duration: 30,
                    },
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                })
            }),
        ClientsModule.registerAsync([
            {
                name: 'API',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.REDIS,
                    options: {
                        url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
                    },
                })
            }
        ]),
        ScheduleModule.forRoot(),
        HttpModule,
    ],
    controllers: [],
    providers: [...databaseProviders, BeamService, BlockService, TransactionService, ValidatorService, ValidatorDelegationService, BlockScheduler, ValidatorScheduler, LumNetworkService],
})
export class SyncSchedulerModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(SyncSchedulerModule.name);

    constructor(
        @InjectQueue(Queues.QUEUE_BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService
    ) {
    }

    async onModuleInit() {
        // Log out
        const ingestEnabled = this._configService.get<boolean>('INGEST_ENABLED') ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        // Make sure to initialize the lum network service
        await this._lumNetworkService.initialise();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

        // Trigger block backward ingestion at startup
        const chainId = await this._lumNetworkService.client.getChainId();
        const blockHeight = await this._lumNetworkService.client.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: blockHeight,
            },
            {
                delay: 120000, // Delayed by 2 minutes to avoid some eventual concurrency issues
            },
        );
        this._logger.log(`Dispatched the backward blocks ingest`);
    }
}
