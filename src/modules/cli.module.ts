import { CacheModule, Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConsoleModule } from 'nestjs-console';
import * as Joi from 'joi';
import * as redisStore from 'cache-manager-redis-store';
import * as parseRedisUrl from 'parse-redis-url-simple';

import { BeamService, BlockService, LumNetworkService, StatService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';

import { BlocksCommands, RedisCommands, TransactionsCommands, ValidatorsCommands } from '@app/console';
import { DatabaseConfig, DatabaseFeatures } from '@app/database';
import { ConfigMap } from '@app/utils';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object(ConfigMap),
        }),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const parsed = parseRedisUrl.parseRedisUrl(configService.get('REDIS_URL'));
                return {
                    store: redisStore,
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
    providers: [
        LumNetworkService,
        BeamService,
        BlockService,
        StatService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        BlocksCommands,
        RedisCommands,
        TransactionsCommands,
        ValidatorsCommands,
    ],
})
export class CliModule implements OnModuleInit {
    constructor(private readonly _lumService: LumNetworkService) {}

    async onModuleInit(): Promise<void> {
        await this._lumService.initialize();
    }
}
