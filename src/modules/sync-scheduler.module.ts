import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as Joi from 'joi';

import { Queue } from 'bull';
import { SentryModule } from '@ntegral/nestjs-sentry';
import * as parseRedisUrl from 'parse-redis-url-simple';

import { AssetScheduler, AsyncQueues, BlockScheduler, GovernanceScheduler, MillionsScheduler, ValidatorScheduler } from '@app/async';

import {
    AssetService,
    BeamService,
    BlockService,
    ChainService,
    DfractService,
    MarketService,
    MillionsDrawService,
    MillionsPoolService,
    MillionsPrizeService,
    ProposalDepositService,
    ProposalService,
    ProposalVoteService,
    TransactionService,
    ValidatorDelegationService,
    ValidatorService,
} from '@app/services';
import { AssetSymbol, ConfigMap, QueueJobs, QueuePriority, Queues, SentryModuleOptions } from '@app/utils';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        ...AsyncQueues.map((queue) => BullModule.registerQueueAsync(queue)),
        ClientsModule.registerAsync([
            {
                name: 'API',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    const parsed = parseRedisUrl.parseRedisUrl(configService.get('REDIS_URL'));
                    return {
                        transport: Transport.REDIS,
                        options: {
                            host: parsed[0].host,
                            port: parsed[0].port,
                            password: parsed[0].password,
                        },
                    };
                },
            },
        ]),
        ScheduleModule.forRoot(),
        HttpModule,
        SentryModule.forRootAsync(SentryModuleOptions),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [],
    providers: [
        AssetScheduler,
        AssetService,
        BeamService,
        BlockScheduler,
        BlockService,
        ChainService,
        DfractService,
        MarketService,
        GovernanceScheduler,
        MillionsDrawService,
        MillionsScheduler,
        MillionsPoolService,
        MillionsPrizeService,
        ProposalService,
        ProposalDepositService,
        ProposalVoteService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        ValidatorScheduler,
    ],
})
export class SyncSchedulerModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(SyncSchedulerModule.name);

    constructor(@InjectQueue(Queues.BLOCKS) private readonly _queue: Queue, private readonly _chainService: ChainService, private readonly _configService: ConfigService) {}

    async onModuleInit() {
        // Pause queues until application bootstrap
        await this._queue.pause();

        // Log out
        const ingestEnabled = this._configService.get<boolean>('INGEST_ENABLED') ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        await this._chainService.initialize();
    }

    async onApplicationBootstrap() {
        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the External Chain Service, exiting...`);
        }

        // Resume queues
        await this._queue.resume();

        // If the backward ingest is disabled, don't ship the job
        if (this._configService.get<boolean>('INGEST_BACKWARD_ENABLED') === false) {
            return;
        }

        // Trigger block backward ingestion at startup
        const chainId = this._chainService.getChain(AssetSymbol.LUM).chainId;
        const blockHeight = await this._chainService.getChain(AssetSymbol.LUM).client.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: blockHeight,
            },
            {
                priority: QueuePriority.URGENT,
            },
        );
        this._logger.log(`Dispatched the backward blocks ingest`);
    }
}
