import {ConfigModule, ConfigService} from "@nestjs/config";

import {createConnection} from "typeorm";

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
    }
];
