import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as Joi from 'joi';

import { Queue } from 'bull';

import { AsyncQueues, BlockScheduler, GovernanceScheduler, ValidatorScheduler, AssetScheduler } from '@app/async';

import {
    BeamService,
    BlockService,
    ChainService,
    LumNetworkService,
    ProposalDepositService,
    ProposalVoteService,
    TransactionService,
    ValidatorDelegationService,
    ValidatorService,
    AssetService,
    DfractService,
} from '@app/services';
import { ConfigMap, QueueJobs, Queues } from '@app/utils';
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
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.REDIS,
                    options: {
                        host: configService.get<string>('REDIS_HOST'),
                        url: configService.get<number>('REDIS_PORT'),
                    },
                }),
            },
        ]),
        ScheduleModule.forRoot(),
        HttpModule,
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [],
    providers: [
        BeamService,
        BlockService,
        ChainService,
        TransactionService,
        ProposalDepositService,
        ProposalVoteService,
        ValidatorService,
        ValidatorDelegationService,
        BlockScheduler,
        GovernanceScheduler,
        ValidatorScheduler,
        AssetScheduler,
        LumNetworkService,
        DfractService,
        AssetService,
    ],
    exports: [ChainService, LumNetworkService, DfractService],
})
export class SyncSchedulerModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(SyncSchedulerModule.name);

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _chainService: ChainService,
    ) {}

    async onModuleInit() {
        // Log out
        const ingestEnabled = this._configService.get<boolean>('INGEST_ENABLED') ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        // Make sure to initialize the chains
        await Promise.all([await this._lumNetworkService.initialize(), await this._chainService.initialize()]);
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the External Chain Service, exiting...`);
        }

        // Trigger block backward ingestion at startup
        const chainId = await this._lumNetworkService.client.getChainId();
        const blockHeight = await this._lumNetworkService.client.getBlockHeight();
        await this._queue.add(
            QueueJobs.TRIGGER_VERIFY_BLOCKS_BACKWARD,
            {
                chainId: chainId,
                fromBlock: this._configService.get<number>('STARTING_HEIGHT'),
                toBlock: blockHeight,
            },
            {
                delay: 120000, // Delayed by 2 minutes to avoid some eventual concurrency issues
            },
        );
        this._logger.log(`Dispatched the backward blocks ingest`);
    }
}
