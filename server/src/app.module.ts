import {Module, OnModuleInit} from '@nestjs/common';
import {ScheduleModule} from "@nestjs/schedule";
import {BullModule} from "@nestjs/bull";

import {
    AccountsController,
    BlocksController,
    TransactionsController,
    ValidatorsController
} from "@app/Http/Controllers";
import {BlockScheduler, ValidatorScheduler} from "@app/Async/Schedulers";
import {BlockConsumer, TransactionConsumer} from "@app/Async/Consumers";
import {ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";
import {IndexBlocksMapping, IndexTransactionsMapping, IndexValidatorsMapping} from "@app/Utils/Indices";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'default',
            redis: {
                host: 'localhost',
                port: 6379
            }
        }),
        ScheduleModule.forRoot()
    ],
    controllers: [AccountsController, BlocksController, TransactionsController, ValidatorsController],
    providers: [
        BlockConsumer, TransactionConsumer,
        BlockScheduler, ValidatorScheduler,
    ],
})
export class AppModule implements OnModuleInit{
    onModuleInit(): any {
        // Init the blocks index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_BLOCKS).then(async exists => {
            if(!exists){
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_BLOCKS, IndexBlocksMapping);
                console.log('Created index blocks');
            }
        });

        // Init the validators index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_VALIDATORS).then(async exists => {
            if(!exists){
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_VALIDATORS, IndexValidatorsMapping);
                console.log('Created index validators');
            }
        });

        // Init the transactions index
        ElasticService.getInstance().indexExists(ElasticIndexes.INDEX_TRANSACTIONS).then(async exists => {
            if(!exists){
                await ElasticService.getInstance().indexCreate(ElasticIndexes.INDEX_TRANSACTIONS, IndexTransactionsMapping);
                console.log('Created index transactions');
            }
        })
    }
}
