import {ConfigModule, ConfigService} from "@nestjs/config";

import {Connection, createConnection} from "typeorm";

import {BlockEntity, TransactionEntity, ValidatorEntity} from "@app/database/entities";

export const databaseProviders = [
    {
        provide: "DATABASE_CONNECTION",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => createConnection({
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "postgres",
            password: "emulator",
            database: "postgres",
            entities: [
                __dirname + "/entities/**/*.entity{.ts,.js}"
            ],
            synchronize: true
        }),
        inject: [ConfigService]
    },
    {
        provide: 'BLOCK_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(BlockEntity),
        inject: ['DATABASE_CONNECTION']
    },
    {
        provide: 'TRANSACTION_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(TransactionEntity),
        inject: ['DATABASE_CONNECTION']
    },
    {
        provide: 'VALIDATOR_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(ValidatorEntity),
        inject: ['DATABASE_CONNECTION']
    }
];
