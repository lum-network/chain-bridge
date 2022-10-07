import { HttpModule } from '@nestjs/axios';
import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as Joi from 'joi';

import { BeamConsumer, BlockConsumer, CoreConsumer, NotificationConsumer } from '@app/async';

import { BeamService, BlockService, LumNetworkService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';
import { ConfigMap, Queues } from '@app/utils';
import { databaseProviders } from '@app/database';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.registerQueueAsync(
            {
                name: Queues.QUEUE_BLOCKS,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT'),
                    },
                    prefix: configService.get<string>('REDIS_PREFIX'),
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                }),
            },
            {
                name: Queues.QUEUE_BEAMS,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT'),
                    },
                    prefix: configService.get<string>('REDIS_PREFIX'),
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                }),
            },
            {
                name: Queues.QUEUE_FAUCET,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT'),
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
                }),
            },
            {
                name: Queues.QUEUE_NOTIFICATIONS,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    redis: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT'),
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
                }),
            },
        ),
        ClientsModule.registerAsync([
            {
                name: 'API',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.REDIS,
                    options: {
                        host: configService.get<string>('REDIS_HOST'),
                        port: configService.get<number>('REDIS_PORT'),
                    },
                }),
            },
        ]),
        HttpModule,
    ],
    controllers: [],
    providers: [
        ...databaseProviders,
        BeamService,
        BlockService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        BeamConsumer,
        BlockConsumer,
        CoreConsumer,
        NotificationConsumer,
        LumNetworkService,
    ],
})
export class SyncConsumerModule implements OnModuleInit, OnApplicationBootstrap {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

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
