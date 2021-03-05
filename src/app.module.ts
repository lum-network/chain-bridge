import * as redisStore from 'cache-manager-redis-store';
import { Queue } from 'bull';

import { Logger, Module, OnModuleInit, OnApplicationBootstrap, CacheModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';

import { AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController } from '@app/Http/Controllers';

import { BlockScheduler, ValidatorScheduler } from '@app/Async/Schedulers';
import { BlockConsumer, NotificationConsumer } from '@app/Async/Consumers';

import { ElasticService, LumNetworkService } from '@app/Services';
import { ElasticIndexes, Queues, QueueJobs } from '@app/Utils/Constants';

import { IndexBlocksMapping, IndexTransactionsMapping, IndexValidatorsMapping } from '@app/Utils/Indices';

import { config } from '@app/Utils/Config';

import { ElasticsearchIndicator, LumNetworkIndicator } from '@app/Http/Indicators';
import { ResponseInterceptor } from '@app/Http/Interceptors';
import { Gateway } from '@app/Websocket';

@Module({
    imports: [
        BullModule.registerQueue({
            name: Queues.QUEUE_DEFAULT,
            redis: {
                host: config.getRedisHost(),
                port: config.getRedisPort(),
            },
            prefix: config.getRedisPrefix(),
        }),
        CacheModule.register({
            store: redisStore,
            host: config.getRedisHost(),
            port: config.getRedisPort(),
            ttl: 60,
            max: 100,
        }),
        ScheduleModule.forRoot(),
        TerminusModule,
    ],
    controllers: [AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController],
    providers: [
        BlockConsumer,
        NotificationConsumer,
        BlockScheduler,
        ValidatorScheduler,
        ElasticsearchIndicator,
        LumNetworkIndicator,
        Gateway,
        ElasticService,
        LumNetworkService,
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(AppModule.name);

    constructor(private readonly _elasticService: ElasticService, @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue, private readonly _lumNetworkService: LumNetworkService) {}

    onModuleInit() {
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
    }

    async onApplicationBootstrap() {
        // Trigger block backward ingestion at startup
        const lumClt = await this._lumNetworkService.getClient();
        const chainId = await lumClt.getChainId();
        const blockHeight = await lumClt.getBlockHeight();
        await this._queue
            .add(
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
