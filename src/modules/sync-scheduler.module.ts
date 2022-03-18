import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Queue } from 'bull';

import { BlockScheduler, ValidatorScheduler } from '@app/async';

import { ElasticService, LumService, LumNetworkService, BlockService, TransactionService, ValidatorService } from '@app/services';
import { Queues, QueueJobs, config } from '@app/utils';

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
        ClientsModule.register([
            {
                name: 'API',
                transport: Transport.REDIS,
                options: {
                    url: config.getRedisURL(),
                },
            },
        ]),
        ScheduleModule.forRoot(),
        HttpModule,
    ],
    controllers: [],
    providers: [BlockService, TransactionService, ValidatorService, BlockScheduler, ValidatorScheduler, ElasticService, LumNetworkService, LumService],
})
export class SyncSchedulerModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(SyncSchedulerModule.name);

    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService, @InjectQueue(Queues.QUEUE_DEFAULT) private readonly _queue: Queue) {}

    async onModuleInit() {
        // Log out
        const ingestEnabled = config.isIngestEnabled() ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        // Make sure to initialize the lum network service
        await this._lumNetworkService.initialise();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
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
