import { HttpModule } from '@nestjs/axios';
import { Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as Joi from 'joi';
import { SentryModule } from '@ntegral/nestjs-sentry';
import * as parseRedisUrl from 'parse-redis-url-simple';

import { AsyncQueues, BeamConsumer, BlockConsumer, NotificationConsumer } from '@app/async';

import { BeamService, BlockService, LumNetworkService, ProposalDepositService, ProposalVoteService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';
import { ConfigMap, SentryModuleOptions } from '@app/utils';
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
        HttpModule,
        SentryModule.forRootAsync(SentryModuleOptions),
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    controllers: [],
    providers: [
        LumNetworkService,
        BeamService,
        BlockService,
        ProposalDepositService,
        ProposalVoteService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        BeamConsumer,
        BlockConsumer,
        NotificationConsumer,
    ],
})
export class SyncConsumerModule implements OnModuleInit, OnApplicationBootstrap {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    async onModuleInit() {
        // Make sure to initialize the lum network service
        await this._lumNetworkService.initialize();
    }

    async onApplicationBootstrap() {
        // If we weren't able to initialize connection with Lum Network, exit the project
        if (!this._lumNetworkService.isInitialized()) {
            throw new Error(`Cannot initialize the Lum Network Service, exiting...`);
        }
    }
}
