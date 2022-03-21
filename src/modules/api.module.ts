import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { ConsoleModule } from 'nestjs-console';

import { LumWalletFactory } from '@lum-network/sdk-javascript';

import * as redisStore from 'cache-manager-redis-store';

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
import { ElasticIndexes, config, IndexBlocksMapping, IndexValidatorsMapping, IndexTransactionsMapping, IndexBeamsMapping, Queues } from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { BlocksCommands, TransactionsCommands, ValidatorsCommands } from '@app/console/commands';

@Module({
    imports: [
        BullModule.registerQueue({
            name: Queues.QUEUE_FAUCET,
            redis: {
                host: config.getRedisHost(),
                port: config.getRedisPort(),
            },
            prefix: config.getRedisPrefix(),
            limiter: {
                max: 1,
                duration: 30,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
            },
        }),
        CacheModule.register({
            store: redisStore,
            host: config.getRedisHost(),
            port: config.getRedisPort(),
            ttl: 10,
            max: 50,
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

        // Display the faucet address
        if (config.getFaucetMnemonic()) {
            const wallet = await LumWalletFactory.fromMnemonic(config.getFaucetMnemonic());
            this._logger.log(`Faucet is listening on address ${wallet.getAddress()}`);
        }
    }
}