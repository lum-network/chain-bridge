import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModuleAsyncOptions} from "@nestjs/typeorm";

import {
    BeamEntity,
    BlockEntity,
    TransactionEntity,
    ValidatorDelegationEntity,
    ValidatorEntity
} from "@app/database/entities";

export const DatabaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [BeamEntity, BlockEntity, TransactionEntity, ValidatorEntity, ValidatorDelegationEntity],
        synchronize: true,
        logging: false,
    }),
};

export const DatabaseFeatures = [BeamEntity, BlockEntity, TransactionEntity, ValidatorEntity, ValidatorDelegationEntity];
