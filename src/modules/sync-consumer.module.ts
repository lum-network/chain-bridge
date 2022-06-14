import {HttpModule} from '@nestjs/axios';
import {Module, OnApplicationBootstrap, OnModuleInit} from '@nestjs/common';
import {BullModule, InjectQueue} from '@nestjs/bull';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {ConfigModule, ConfigService} from "@nestjs/config";

import * as Joi from "joi";

import {Queue} from 'bull';

import {BeamConsumer, BlockConsumer, CoreConsumer, NotificationConsumer} from '@app/async';

import {
    BeamService,
    BlockService,
    LumNetworkService,
    TransactionService,
    ValidatorService
} from '@app/services';
import {ConfigMap, Queues} from '@app/utils';
import {databaseProviders} from "@app/database";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.registerQueueAsync({
            name: Queues.QUEUE_DEFAULT,
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
        }, {
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
        HttpModule,
    ],
    controllers: [],
    providers: [...databaseProviders, BeamService, BlockService, TransactionService, ValidatorService, BeamConsumer, BlockConsumer, CoreConsumer, NotificationConsumer, LumNetworkService],
})
export class SyncConsumerModule implements OnModuleInit, OnApplicationBootstrap {
    constructor(private readonly _lumNetworkService: LumNetworkService, @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {
    }

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
