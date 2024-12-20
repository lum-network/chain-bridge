import { HttpModule } from '@nestjs/axios';
import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as Joi from 'joi';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';

import { BlockConsumer, MillionsConsumer, QueueConfig } from '@app/async';

import { BlockService, ChainService, MarketService, MillionsDepositService, ProposalDepositService, ProposalService, ProposalVoteService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';
import { ConfigMap, Queues } from '@app/utils';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.forRootAsync(QueueConfig),
        BullModule.registerQueue(...Object.values(Queues).map((name) => ({ name }) as any)),
        LoggerModule.forRoot(),
        HttpModule,
        SentryModule.forRoot(),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [],
    providers: [ChainService, BlockService, MarketService, MillionsDepositService, ProposalService, ProposalDepositService, ProposalVoteService, TransactionService, ValidatorService, ValidatorDelegationService, BlockConsumer, MillionsConsumer],
})
export class SyncConsumerModule implements OnModuleInit, OnApplicationBootstrap {
    constructor(private readonly _chainService: ChainService) {}

    async onModuleInit() {
        // Make sure to initialize the lum network service
        await this._chainService.initialize();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._chainService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }
    }
}
