import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap, ValidationPipe, HttpException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as redisStore from 'cache-manager-redis-store';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import * as parseRedisUrl from 'parse-redis-url-simple';

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

import {
    LumNetworkService,
    BlockService,
    TransactionService,
    ValidatorService,
    BeamService,
    ValidatorDelegationService,
    StatService,
    ProposalVoteService,
    ProposalDepositService,
} from '@app/services';

import { metrics, ConfigMap, PayloadValidationOptions, SentryModuleOptions } from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { AsyncQueues } from '@app/async';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        ...AsyncQueues.map((queue) => BullModule.registerQueueAsync(queue)),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const parsed = parseRedisUrl.parseRedisUrl(configService.get('REDIS_URL'));
                return {
                    store: redisStore,
                    host: parsed[0].host,
                    port: parsed[0].port,
                    password: parsed[0].password,
                    ttl: 10,
                    max: 50,
                };
            },
            inject: [ConfigService],
        }),
        SentryModule.forRootAsync(SentryModuleOptions),
        TerminusModule,
        HttpModule,
        PrometheusModule.register(),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
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
        BeamService,
        BlockService,
        StatService,
        TransactionService,
        ValidatorService,
        ProposalVoteService,
        ProposalDepositService,
        ValidatorDelegationService,
        LumNetworkIndicator,
        GatewayWebsocket,
        LumNetworkService,
        ...metrics,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        {
            provide: APP_INTERCEPTOR,
            useFactory: () =>
                new SentryInterceptor({
                    filters: [
                        {
                            type: HttpException,
                            filter: (exception: HttpException) => exception.getStatus() >= 500,
                        },
                    ],
                }),
        },
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
