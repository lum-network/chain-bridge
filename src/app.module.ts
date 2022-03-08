import { Logger, Module, OnModuleInit, CacheModule, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

import * as redisStore from 'cache-manager-redis-store';

import { LumWalletFactory } from '@lum-network/sdk-javascript';

import { Queue } from 'bull';

import {
    AccountsController,
    BlocksController,
    CoreController,
    ElasticsearchIndicator,
    LumNetworkIndicator,
    HealthController,
    ResponseInterceptor,
    TransactionsController,
    ValidatorsController,
    GovernanceController,
} from '@app/http';

import { BlockConsumer, BlockScheduler, CoreConsumer, NotificationConsumer, ValidatorScheduler } from '@app/async';

import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes, Queues, QueueJobs, config, IndexBlocksMapping, IndexValidatorsMapping, IndexTransactionsMapping, IndexBeamsMapping } from '@app/utils';

import { GatewayWebsocket } from '@app/websocket';
import { HttpModule } from '@nestjs/axios';
import { LumService } from '@app/services/lum.service';
import { BeamsController } from '@app/http/controllers/beams.controller';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: Queues.QUEUE_DEFAULT,
                redis: {
                    host: config.getRedisHost(),
                    port: config.getRedisPort(),
                },
                prefix: config.getRedisPrefix(),
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            },
            {
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
            },
        ),
        CacheModule.register({
            store: redisStore,
            host: config.getRedisHost(),
            port: config.getRedisPort(),
            ttl: 10,
            max: 50,
        }),
        ScheduleModule.forRoot(),
        TerminusModule,
        HttpModule,
    ],
    controllers: [AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController, BeamsController, GovernanceController],
    providers: [
        BlockConsumer,
        CoreConsumer,
        NotificationConsumer,
        BlockScheduler,
        ValidatorScheduler,
        ElasticsearchIndicator,
        LumNetworkIndicator,
        GatewayWebsocket,
        ElasticService,
        LumNetworkService,
        LumService,
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(AppModule.name);

    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService, @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {}

    async onModuleInit() {
        // Log out
        const ingestEnabled = config.isIngestEnabled() ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        // Init the blocks index
        this._elasticService.indexExists(ElasticIndexes.INDEX_BLOCKS).then(async exists => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_BLOCKS, IndexBlocksMapping);
                this._logger.debug('Created index blocks');
            }
        });

        // Init the validators index
        this._elasticService.indexExists(ElasticIndexes.INDEX_VALIDATORS).then(async exists => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_VALIDATORS, IndexValidatorsMapping);
                this._logger.debug('Created index validators');
            }
        });

        // Init the transactions index
        this._elasticService.indexExists(ElasticIndexes.INDEX_TRANSACTIONS).then(async exists => {
            if (!exists) {
                await this._elasticService.indexCreate(ElasticIndexes.INDEX_TRANSACTIONS, IndexTransactionsMapping);
                this._logger.debug('Created index transactions');
            }
        });

        // Init the beams index
        this._elasticService.indexExists(ElasticIndexes.INDEX_BEAMS).then(async exists => {
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

        // Trigger block backward ingestion at startup
        const lumClt = await this._lumNetworkService.getClient();
        const chainId = await lumClt.getChainId();
        const blockHeight = await lumClt.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: 1,
                toBlock: blockHeight,
            },
            {
                delay: 120000, // Delayed by 2 minutes to avoid some eventual concurrency issues
            },
        );
    }
}
