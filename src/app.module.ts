import { Logger, Module, OnModuleInit, CacheModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';

import * as redisStore from 'cache-manager-redis-store';

import { AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController } from '@app/Http/Controllers';

import { BlockScheduler, ValidatorScheduler } from '@app/Async/Schedulers';
import { BlockConsumer, NotificationConsumer, TransactionConsumer } from '@app/Async/Consumers';

import { ElasticService } from '@app/Services';
import { ElasticIndexes, Queues } from '@app/Utils/Constants';

import { IndexBlocksMapping, IndexTransactionsMapping, IndexValidatorsMapping } from '@app/Utils/Indices';

import { config } from '@app/Utils/Config';

import { ElasticsearchIndicator } from '@app/Http/Indicators';
import { ResponseInterceptor } from '@app/Http/Interceptors';
import { Gateway } from '@app/Websocket';

@Module({
    imports: [
        BullModule.registerQueue({
            name: Queues.QUEUE_DEFAULT,
            redis: {
                host: config.getValue<string>('REDIS_HOST', true),
                port: config.getValue<number>('REDIS_PORT', true),
            },
            prefix: config.getMode(),
        }),
        CacheModule.register({
            store: redisStore,
            host: config.getValue<string>('REDIS_HOST', true),
            port: config.getValue<number>('REDIS_PORT', true),
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
        TransactionConsumer,
        BlockScheduler,
        ValidatorScheduler,
        ElasticsearchIndicator,
        Gateway,
        ElasticService,
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule implements OnModuleInit {
    private readonly _logger: Logger = new Logger(AppModule.name);

    constructor(private readonly _elasticService: ElasticService) {}

    onModuleInit(): any {
        // Log out
        const blocksIngestEnabled = config.isBlockIngestionEnabled() ? 'enabled' : 'disabled';
        const transactionsIngestEnabled = config.isTransactionsIngestionEnabled() ? 'enabled' : 'disabled';
        this._logger.log(`AppModule blocks ingestion ${blocksIngestEnabled} and transactions ingestion ${transactionsIngestEnabled} (${config.getBlockIngestionMaxLength()})`);

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
