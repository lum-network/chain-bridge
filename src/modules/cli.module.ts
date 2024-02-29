import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';

import { ConsoleModule } from 'nestjs-console';
import * as Joi from 'joi';
import * as redisStore from 'cache-manager-redis-store';

import { BlockService, ChainService, MarketService, ProposalService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';

import { BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands } from '@app/console';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { ConfigMap, Queues } from '@app/utils';
import { QueueConfig } from '@app/async';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        BullModule.forRootAsync(QueueConfig),
        BullModule.registerQueue(...Object.values(Queues).map((name) => ({ name }) as any)),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisUrl = new URL(configService.get('REDIS_URL'));
                return {
                    store: redisStore as unknown as CacheStore,
                    host: redisUrl.hostname,
                    port: parseInt(redisUrl.port),
                    username: redisUrl.username,
                    password: redisUrl.password,
                    ttl: 10,
                    max: 50,
                };
            },
            inject: [ConfigService],
        }),
        ConsoleModule,
        HttpModule,
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    providers: [ChainService, BlockService, MarketService, ProposalService, TransactionService, ValidatorService, ValidatorDelegationService, BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands],
})
export class CliModule implements OnModuleInit {
    constructor(private readonly _chainService: ChainService) {}

    async onModuleInit(): Promise<void> {
        await this._chainService.initialize();
    }
}
