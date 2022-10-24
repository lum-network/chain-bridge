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
    EvmosService,
    TransactionService,
    ValidatorService,
    BeamService,
    ValidatorDelegationService,
    StatService,
    ProposalVoteService,
    ProposalDepositService,
    OsmosisService,
    JunoService,
    ComdexService,
    StargazeService,
    CosmosService,
    AkashNetworkService,
    SentinelService,
    KichainService,
    DfractService,
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
        StatService,
        TransactionService,
        ValidatorService,
        ProposalVoteService,
        ProposalDepositService,
        ValidatorDelegationService,
        LumNetworkIndicator,
        GatewayWebsocket,
        LumNetworkService,
        OsmosisService,
        CosmosService,
        JunoService,
        EvmosService,
        ComdexService,
        StargazeService,
        AkashNetworkService,
        SentinelService,
        KichainService,
        DfractService,
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
    exports: [LumNetworkService, OsmosisService, CosmosService, JunoService, EvmosService, ComdexService, StargazeService, AkashNetworkService, SentinelService, KichainService, DfractService],
})
export class ApiModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(ApiModule.name);

    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _osmosisService: OsmosisService,
        private readonly _cosmosService: CosmosService,
        private readonly _junoService: JunoService,
        private readonly _evmosService: EvmosService,
        private readonly _comdexService: ComdexService,
        private readonly _stargazeService: StargazeService,
        private readonly _akashNetworkService: AkashNetworkService,
        private readonly _sentinelService: SentinelService,
        private readonly _kiChainService: KichainService,
    ) {}

    async onModuleInit() {
        // Make sure to initialize the lum network service
        await Promise.all([
            await this._lumNetworkService.initialize(),
            await this._cosmosService.initializeCosmos(),
            await this._osmosisService.initializeOsmosis(),
            await this._junoService.initializeJuno(),
            await this._evmosService.initializeEvmos(),
            await this._comdexService.initializeComdex(),
            await this._stargazeService.initializeStargaze(),
            await this._akashNetworkService.initializeAkashNetwork(),
            await this._sentinelService.initializeSentinel(),
            await this._kiChainService.initializeKichain(),
        ]);
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

        if (!this._cosmosService.isInitializedCosmos()) {
            throw new Error(`Cannot initialize the Cosmos Service, exiting...`);
        }

        if (!this._osmosisService.isInitializedOsmosis()) {
            throw new Error(`Cannot initialize the Osmosis Service, exiting...`);
        }

        if (!this._junoService.isInitializedJuno()) {
            throw new Error(`Cannot initialize the Juno Service, exiting...`);
        }

        if (!this._evmosService.isInitializedEvmos()) {
            throw new Error(`Cannot initialize the Evmos Service, exiting...`);
        }

        if (!this._comdexService.isInitializedComdex()) {
            throw new Error(`Cannot initialize the Comdex Service, exiting...`);
        }

        if (!this._stargazeService.isInitializedStargaze()) {
            throw new Error(`Cannot initialize the Stargaze Service, exiting...`);
        }

        if (!this._akashNetworkService.isInitializedAkashNetwork()) {
            throw new Error(`Cannot initialize the Akash Network Service, exiting...`);
        }

        if (!this._sentinelService.isInitializedSentinel()) {
            throw new Error(`Cannot initialize the Sentinel Service, exiting...`);
        }

        if (!this._kiChainService.isInitializedKichain()) {
            throw new Error(`Cannot initialize the Kichain Service, exiting...`);
        }
    }
}
