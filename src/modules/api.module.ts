import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap } from '@nestjs/common';
import {ConfigModule, ConfigService} from "@nestjs/config";
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { ConsoleModule } from 'nestjs-console';

import * as redisStore from 'cache-manager-redis-store';

import * as Joi from 'joi';

import {
    AccountsController,
    BeamsController,
    BlocksController,
    CoreController,
    ElasticsearchIndicator,
    GovernanceController,
    HealthController,
    HttpExceptionFilter,
    LumNetworkIndicator,
    ResponseInterceptor,
    TransactionsController,
    ValidatorsController,
} from '@app/http';

import { ElasticService, LumService, LumNetworkService, BlockService, TransactionService, ValidatorService } from '@app/services';
import {
    ElasticIndexes,
    IndexBlocksMapping,
    IndexValidatorsMapping,
    IndexTransactionsMapping,
    IndexBeamsMapping,
    Queues,
    ConfigMap
} from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { BlocksCommands, TransactionsCommands, ValidatorsCommands } from '@app/console/commands';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.registerQueueAsync({
            name: Queues.QUEUE_FAUCET,
            imports: [ConfigModule],
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
            }),
            inject: [ConfigService]
        }),
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
    controllers: [AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController, BeamsController, GovernanceController],
    providers: [
        BlockService,
        TransactionService,
        ValidatorService,
        ElasticsearchIndicator,
        LumNetworkIndicator,
        GatewayWebsocket,
        ElasticService,
        LumNetworkService,
        LumService,
        BlocksCommands,
        TransactionsCommands,
        ValidatorsCommands,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class ApiModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(ApiModule.name);

    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService) {}

    async onModuleInit() {
        // Init the blocks index
        this._elasticService.indexExists(ElasticIndexes.INDEX_BLOCKS).then(async (exists) => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_BLOCKS, IndexBlocksMapping);
                this._logger.debug('Created index blocks');
            }
        });

        // Init the validators index
        this._elasticService.indexExists(ElasticIndexes.INDEX_VALIDATORS).then(async (exists) => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_VALIDATORS, IndexValidatorsMapping);
                this._logger.debug('Created index validators');
            }
        });

        // Init the transactions index
        this._elasticService.indexExists(ElasticIndexes.INDEX_TRANSACTIONS).then(async (exists) => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_TRANSACTIONS, IndexTransactionsMapping);
                this._logger.debug('Created index transactions');
            }
        });

        // Init the beams index
        this._elasticService.indexExists(ElasticIndexes.INDEX_BEAMS).then(async (exists) => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_BEAMS, IndexBeamsMapping);
                this._logger.debug('Created index beams');
            }
        });

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
