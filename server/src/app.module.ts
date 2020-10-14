import {Module, OnModuleInit} from '@nestjs/common';
import {ScheduleModule} from "@nestjs/schedule";

import {ValidatorsController} from "@app/Http/Controllers";
import {BlockScheduler, ValidatorScheduler} from "@app/Async/Schedulers";
import {ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";
import {IndexBlocksMapping, IndexValidatorsMapping} from "@app/Utils/Indices";

@Module({
    imports: [
        ScheduleModule.forRoot()
    ],
    controllers: [ValidatorsController],
    providers: [
        BlockScheduler,
        ValidatorScheduler
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
    }
}
