import { CacheModule, Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConsoleModule } from 'nestjs-console';
import * as Joi from 'joi';
import * as redisStore from 'cache-manager-redis-store';

import { BeamService, BlockService, ElasticsearchService, LumNetworkService, StatService, TransactionService, ValidatorDelegationService, ValidatorService } from '@app/services';

import { BlocksCommands, MigrationCommands, RedisCommands, TransactionsCommands, ValidatorsCommands } from '@app/console';
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
            useFactory: (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
                ttl: 10,
                max: 50,
            }),
            inject: [ConfigService],
        }),
        ConsoleModule,
        HttpModule,
        TypeOrmModule.forRootAsync(DatabaseConfig),
        TypeOrmModule.forFeature(DatabaseFeatures),
    ],
    providers: [
        LumNetworkService,
        ElasticsearchService,
        BeamService,
        BlockService,
        StatService,
        TransactionService,
        ValidatorService,
        ValidatorDelegationService,
        BlocksCommands,
        MigrationCommands,
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
