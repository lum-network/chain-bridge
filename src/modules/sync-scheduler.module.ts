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
import { LoggerModule } from 'nestjs-pino';
import * as parseRedisUrl from 'parse-redis-url-simple';

import { BlockScheduler, GovernanceScheduler, MarketScheduler, MillionsScheduler, QueueConfig, ValidatorScheduler } from '@app/async';

import {
    BlockService,
    ChainService,
    MarketService,
    MillionsBiggestWinnerService,
    MillionsDepositorService,
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
import { ConfigMap, Queues, SentryModuleOptions } from '@app/utils';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.forRootAsync(QueueConfig),
        BullModule.registerQueue(...Object.values(Queues).map((name) => ({ name }) as any)),
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
        LoggerModule.forRoot(),
        ScheduleModule.forRoot(),
        HttpModule,
        SentryModule.forRootAsync(SentryModuleOptions),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [],
    providers: [
        BlockScheduler,
        BlockService,
        ChainService,
        MarketService,
        GovernanceScheduler,
        MarketScheduler,
        MillionsBiggestWinnerService,
        MillionsDepositorService,
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

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _chainService: ChainService,
        private readonly _configService: ConfigService,
    ) {}

    async onModuleInit() {
        // Pause queues until application bootstrap
        await this._queue.pause();

        // Log out
        this._logger.log(`AppModule ingestion: ${this._configService.get<boolean>('INGEST_ENABLED') ? 'enabled' : 'disabled'}`);

        await this._chainService.initialize();
    }

    async onApplicationBootstrap() {
        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the External Chain Service, exiting...`);
        }

        // Resume queues
        await this._queue.resume();
    }
}
