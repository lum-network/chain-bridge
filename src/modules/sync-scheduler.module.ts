import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as Joi from 'joi';

import { Queue } from 'bull';

import { AsyncQueues, BlockScheduler, GovernanceScheduler, ValidatorScheduler, DfractScheduler } from '@app/async';

import {
    BeamService,
    BlockService,
    EvmosService,
    CosmosService,
    JunoService,
    LumNetworkService,
    OsmosisService,
    ProposalDepositService,
    ProposalVoteService,
    TransactionService,
    ValidatorDelegationService,
    ValidatorService,
    ComdexService,
    StargazeService,
    AkashNetworkService,
    SentinelService,
    KichainService,
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
        TransactionService,
        ProposalDepositService,
        ProposalVoteService,
        ValidatorService,
        ValidatorDelegationService,
        BlockScheduler,
        GovernanceScheduler,
        ValidatorScheduler,
        DfractScheduler,
        LumNetworkService,
        CosmosService,
        OsmosisService,
        JunoService,
        EvmosService,
        ComdexService,
        StargazeService,
        AkashNetworkService,
        SentinelService,
        KichainService,
        DfractService,
    ],
    exports: [LumNetworkService, OsmosisService, CosmosService, JunoService, EvmosService, ComdexService, StargazeService, AkashNetworkService, SentinelService, KichainService, DfractService],
})
export class SyncSchedulerModule implements OnModuleInit, OnApplicationBootstrap {
    private readonly _logger: Logger = new Logger(SyncSchedulerModule.name);

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _osmosisService: OsmosisService,
        private readonly _cosmosService: CosmosService,
        private readonly _junoService: JunoService,
        private readonly _evmosService: EvmosService,
        private readonly _comdexService: ComdexService,
        private readonly _stargazeService: StargazeService,
        private readonly _akashNetworkService: AkashNetworkService,
        private readonly _sentinelService: SentinelService,
        private readonly _kiChainService: KichainService,
    ) {}

    async onModuleInit() {
        // Log out
        const ingestEnabled = this._configService.get<boolean>('INGEST_ENABLED') ? 'enabled' : 'disabled';
        this._logger.log(`AppModule ingestion: ${ingestEnabled}`);

        // Make sure to initialize the lum network service
        await Promise.all([
            await this._lumNetworkService.initialize(),
            await this._cosmosService.initializeCosmos(),
            await this._osmosisService.initializeOsmosis(),
            await this._junoService.initializeJuno(),
            await this._junoService.initializeJuno(),
            await this._evmosService.initializeEvmos(),
            await this._comdexService.initializeComdex(),
            await this._stargazeService.initializeStargaze(),
            await this._akashNetworkService.initializeAkashNetwork(),
            await this._sentinelService.initializeSentinel(),
            await this._kiChainService.initializeKichain(),
        ]);
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }

        if (!this._cosmosService.isInitializedCosmos()) {
            throw new Error(`Cannot initialize the Cosmos Service, exiting...`);
        }

        if (!this._osmosisService.isInitializedOsmosis()) {
            throw new Error(`Cannot initialize the Osmosis Service, exiting...`);
        }

        if (!this._junoService.isInitializedJuno()) {
            throw new Error(`Cannot initialize the Juno Service, exiting...`);
        }

        if (!this._junoService.isInitializedJuno()) {
            throw new Error(`Cannot initialize the Juno Service, exiting...`);
        }

        if (!this._comdexService.isInitializedComdex()) {
            throw new Error(`Cannot initialize the Comdex Service, exiting...`);
        }

        if (!this._stargazeService.isInitializedStargaze()) {
            throw new Error(`Cannot initialize the Stargaze Service, exiting...`);
        }

        if (!this._akashNetworkService.isInitializedAkashNetwork()) {
            throw new Error(`Cannot initialize the Akash Network Service, exiting...`);
        }

        if (!this._sentinelService.isInitializedSentinel()) {
            throw new Error(`Cannot initialize the Sentinel Service, exiting...`);
        }

        if (!this._kiChainService.isInitializedKichain()) {
            throw new Error(`Cannot initialize the Kichain Service, exiting...`);
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
