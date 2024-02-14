import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';

import { ConsoleModule } from 'nestjs-console';
import * as Joi from 'joi';
import * as redisStore from 'cache-manager-redis-store';
import * as parseRedisUrl from 'parse-redis-url-simple';

import { BeamService, BlockService, ChainService, MarketService, ProposalService, StatService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';

import { BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands } from '@app/console';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { ConfigMap } from '@app/utils';
import { AsyncQueues } from '@app/async';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        ...AsyncQueues.map((queue) => BullModule.registerQueueAsync(queue)),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const parsed = parseRedisUrl.parseRedisUrl(configService.get('REDIS_URL'));
                return {
                    store: redisStore as unknown as CacheStore,
                    host: parsed[0].host,
                    port: parsed[0].port,
                    password: parsed[0].password,
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
    providers: [ChainService, BeamService, BlockService, MarketService, StatService, ProposalService, TransactionService, ValidatorService, ValidatorDelegationService, BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands],
})
export class CliModule implements OnModuleInit {
    constructor(private readonly _chainService: ChainService) {}

    async onModuleInit(): Promise<void> {
        await this._chainService.initialize();
    }
}
