import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {ScheduleModule} from "@nestjs/schedule";
import {BullModule} from "@nestjs/bull";
import {TerminusModule} from '@nestjs/terminus';

import {
    AccountsController,
    BlocksController, CoreController, HealthController,
    TransactionsController,
    ValidatorsController
} from "@app/Http/Controllers";
import {BlockScheduler, ValidatorScheduler} from "@app/Async/Schedulers";
import {BlockConsumer, TransactionConsumer} from "@app/Async/Consumers";
import {ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";
import {IndexBlocksMapping, IndexTransactionsMapping, IndexValidatorsMapping} from "@app/Utils/Indices";
import {config} from "@app/Utils/Config";
import {ElasticsearchIndicator} from "@app/Http/Indicators";
import {ResponseInterceptor} from "@app/Http/Interceptors";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'default',
            redis: {
                host: config.getValue<string>('REDIS_HOST'),
                port: config.getValue<number>('REDIS_PORT', true)
            }
        }),
        ScheduleModule.forRoot(),
        TerminusModule
    ],
    controllers: [AccountsController, BlocksController, CoreController, HealthController, TransactionsController, ValidatorsController],
    providers: [
        BlockConsumer, TransactionConsumer,
        BlockScheduler, ValidatorScheduler,
        ElasticsearchIndicator,
        {provide: APP_INTERCEPTOR, useClass: ResponseInterceptor}
    ],
})
export class AppModule implements OnModuleInit {
    private readonly _logger: Logger = new Logger(AppModule.name);

    onModuleInit(): any {
        // Log out
        const blocksIngestEnabled = config.getValue<boolean>('INGEST_BLOCKS_ENABLED') ? 'enabled' : 'disabled';
        const transactionsIngestEnabled = config.getValue<boolean>('INGEST_TRANSACTIONS_ENABLED') ? 'enabled' : 'disabled';
        this._logger.log(`AppModule blocks ingestion ${blocksIngestEnabled} and transactions ingestion ${transactionsIngestEnabled} (${config.getValue<number>('INGEST_BLOCKS_LENGTH')})`);

        // Init the blocks index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_BLOCKS).then(async exists => {
            if (!exists) {
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_BLOCKS, IndexBlocksMapping);
                console.log('Created index blocks');
            }
        });

        // Init the validators index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_VALIDATORS).then(async exists => {
            if (!exists) {
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_VALIDATORS, IndexValidatorsMapping);
                console.log('Created index validators');
            }
        });

        // Init the transactions index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_TRANSACTIONS).then(async exists => {
            if (!exists) {
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_TRANSACTIONS, IndexTransactionsMapping);
                console.log('Created index transactions');
            }
        })
    }
}
