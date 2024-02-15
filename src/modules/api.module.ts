import { HttpModule } from '@nestjs/axios';
import { Module, OnModuleInit, OnApplicationBootstrap, ValidationPipe, HttpException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';

import type { RedisClientOptions } from 'redis';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import * as redisStore from 'cache-manager-redis-store';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import * as parseRedisUrl from 'parse-redis-url-simple';

import * as Joi from 'joi';

import {
    AccountsController,
    BeamsController,
    BlocksController,
    CoreController,
    GovernanceController,
    HealthController,
    LumNetworkIndicator,
    MarketController,
    MillionsController,
    PaginationInterceptor,
    ResponseInterceptor,
    SearchController,
    StatsController,
    TransactionsController,
    ValidatorsController,
} from '@app/http';

import {
    BeamService,
    BlockService,
    ChainService,
    MarketService,
    MillionsBiggestWinnerService,
    MillionsCampaignService,
    MillionsCampaignMemberService,
    MillionsDepositService,
    MillionsDepositorService,
    MillionsDrawService,
    MillionsPoolService,
    MillionsPrizeService,
    ProposalDepositService,
    ProposalService,
    ProposalVoteService,
    StatService,
    TransactionService,
    ValidatorService,
    ValidatorDelegationService,
} from '@app/services';

import { ConfigMap, metrics, PayloadValidationOptions, SentryModuleOptions } from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { AsyncQueues, MetricScheduler } from '@app/async';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        ...AsyncQueues.map((queue) => BullModule.registerQueueAsync(queue)),
        CacheModule.registerAsync<RedisClientOptions>({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const parsed = parseRedisUrl.parseRedisUrl(configService.get('REDIS_URL'));
                return {
                    store: redisStore as unknown as CacheStore,
                    host: parsed[0].host,
                    port: parsed[0].port,
                    password: parsed[0].password,
                    ttl: 10,
                    max: 50,
                };
            },
            inject: [ConfigService],
        }),
        LoggerModule.forRoot(),
        ScheduleModule.forRoot(),
        SentryModule.forRootAsync(SentryModuleOptions),
        TerminusModule,
        HttpModule,
        PrometheusModule.register(),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [AccountsController, BeamsController, BlocksController, CoreController, GovernanceController, HealthController, MarketController, MillionsController, SearchController, StatsController, TransactionsController, ValidatorsController],
    providers: [
        BeamService,
        BlockService,
        ChainService,
        GatewayWebsocket,
        LumNetworkIndicator,
        MarketService,
        ...metrics,
        MillionsBiggestWinnerService,
        MillionsCampaignService,
        MillionsCampaignMemberService,
        MillionsDepositService,
        MillionsDepositorService,
        MetricScheduler,
        MillionsDrawService,
        MillionsPoolService,
        MillionsPrizeService,
        ProposalService,
        ProposalVoteService,
        ProposalDepositService,
        StatService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
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
    constructor(private readonly _chainService: ChainService) {}

    async onModuleInit() {
        // We want first LUM to be initialized before initializing the other chains
        await this._chainService.initialize();
    }

    async onApplicationBootstrap() {
        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the External Service, exiting...`);
        }
    }
}
