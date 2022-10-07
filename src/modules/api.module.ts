import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { ConsoleModule } from 'nestjs-console';

import * as redisStore from 'cache-manager-redis-store';

import * as Joi from 'joi';

import {
    AccountsController,
    BeamsController,
    BlocksController,
    CoreController,
    FaucetController,
    GovernanceController,
    HealthController,
    HttpExceptionFilter,
    LumNetworkIndicator,
    PaginationInterceptor,
    ResponseInterceptor,
    SearchController,
    StatsController,
    TransactionsController,
    ValidatorsController,
} from '@app/http';

import { LumNetworkService, BlockService, TransactionService, ValidatorService, BeamService, ValidatorDelegationService, StatService } from '@app/services';
import { Queues, ConfigMap, PayloadValidationOptions } from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands } from '@app/console/commands';
import { databaseProviders } from '@app/database';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.registerQueueAsync(
            {
                name: Queues.QUEUE_FAUCET,
                imports: [ConfigModule],
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
                inject: [ConfigService],
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
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
                ttl: 10,
                max: 50,
            }),
            inject: [ConfigService],
        }),
        ConsoleModule,
        TerminusModule,
        HttpModule,
    ],
    controllers: [
        AccountsController,
        BeamsController,
        BlocksController,
        CoreController,
        FaucetController,
        GovernanceController,
        HealthController,
        SearchController,
        StatsController,
        TransactionsController,
        ValidatorsController,
    ],
    providers: [
        ...databaseProviders,
        BeamService,
        BlockService,
        StatService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        LumNetworkIndicator,
        GatewayWebsocket,
        LumNetworkService,
        BlocksCommands,
        RedisCommands,
        TransactionsCommands,
        ValidatorsCommands,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_PIPE, useFactory: () => new ValidationPipe(PayloadValidationOptions) },
    ],
})
export class ApiModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(ApiModule.name);

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
