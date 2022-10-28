import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap, ValidationPipe, HttpException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as redisStore from 'cache-manager-redis-store';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';

import * as Joi from 'joi';

import {
    AccountsController,
    BeamsController,
    BlocksController,
    CoreController,
    DfractController,
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
    ChainService,
    TransactionService,
    ValidatorService,
    BeamService,
    ValidatorDelegationService,
    StatService,
    ProposalVoteService,
    ProposalDepositService,
    DfractService,
    AssetService,
} from '@app/services';

import { ConfigMap, PayloadValidationOptions, SentryModuleOptions } from '@app/utils';

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
            useFactory: (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
                ttl: 10,
                max: 50,
            }),
            inject: [ConfigService],
        }),
        SentryModule.forRootAsync(SentryModuleOptions),
        TerminusModule,
        HttpModule,
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [
        AccountsController,
        BeamsController,
        BlocksController,
        DfractController,
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
        ChainService,
        StatService,
        TransactionService,
        ValidatorService,
        ProposalVoteService,
        ProposalDepositService,
        ValidatorDelegationService,
        LumNetworkIndicator,
        GatewayWebsocket,
        LumNetworkService,
        DfractService,
        AssetService,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
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
    exports: [ChainService, LumNetworkService, DfractService],
})
export class ApiModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(ApiModule.name);

    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _chainService: ChainService) {}

    async onModuleInit() {
        // We want first LUM to be initialized before intializing the other chains
        await this._lumNetworkService.initialize();
        await this._chainService.initialize();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the External Service, exiting...`);
        }
    }
}
