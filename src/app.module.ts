import * as redisStore from 'cache-manager-redis-store';

import { Logger, Module, OnModuleInit, CacheModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';

import {
    AccountsController,
    BlocksController,
    CoreController,
    HealthController,
    TransactionsController,
    ValidatorsController,
} from '@app/Http/Controllers';

import { BlockScheduler, ValidatorScheduler } from '@app/Async/Schedulers';
import { BlockConsumer, NotificationConsumer } from '@app/Async/Consumers';

import { ElasticService, LumNetworkService } from '@app/Services';
import { ElasticIndexes, Queues } from '@app/Utils/Constants';

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
        ElasticsearchIndicator, LumNetworkIndicator,
        Gateway,
        ElasticService,
        LumNetworkService,
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule implements OnModuleInit {
    private readonly _logger: Logger = new Logger(AppModule.name);

    constructor(
        private readonly _elasticService: ElasticService,
        private readonly _scheduleRegistry: SchedulerRegistry,
        private readonly _lumNetworkService: LumNetworkService,
    ) {
    }

    onModuleInit() {
        // We first check lum network service
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

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
}
