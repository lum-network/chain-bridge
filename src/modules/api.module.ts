import { HttpModule } from '@nestjs/axios';
import { Module, OnModuleInit, OnApplicationBootstrap, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import { redisStore } from 'cache-manager-redis-yet';

import * as Joi from 'joi';

import {
    AccountsController,
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
    TransactionsController,
    ValidatorsController,
} from '@app/http';

import {
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
    TransactionService,
    ValidatorService,
    ValidatorDelegationService,
} from '@app/services';

import { ConfigMap, metrics, PayloadValidationOptions, Queues } from '@app/utils';

import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { MetricScheduler, QueueConfig } from '@app/async';

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.forRootAsync(QueueConfig),
        BullModule.registerQueue(...Object.values(Queues).map((name) => ({ name }) as any)),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    ttl: 10000,
                    url: configService.get('REDIS_URL'),
                    keyPrefix: 'api',
                    pingInterval: 1000,
                    socket:
                        configService.get('ENV') === 'production'
                            ? {
                                  tls: true,
                                  rejectUnauthorized: false,
                              }
                            : null,
                }),
            }),
        }),
        LoggerModule.forRoot(),
        ScheduleModule.forRoot(),
        TerminusModule,
        HttpModule,
        PrometheusModule.register(),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [AccountsController, BlocksController, CoreController, GovernanceController, HealthController, MarketController, MillionsController, SearchController, TransactionsController, ValidatorsController],
    providers: [
        BlockService,
        ChainService,
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
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
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
