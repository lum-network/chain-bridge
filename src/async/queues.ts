import { BullModuleAsyncOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Queues } from '@app/utils';

export const AsyncQueues: BullModuleAsyncOptions[] = [
    {
        name: Queues.ASSETS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            limiter: {
                max: 1,
                duration: 30,
            },
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false,
            },
        }),
    },
    {
        name: Queues.BEAMS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false,
            },
        }),
    },
    {
        name: Queues.BLOCKS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false,
            },
        }),
    },
    {
        name: Queues.NOTIFICATIONS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            limiter: {
                max: 1,
                duration: 30,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
            },
        }),
    },
];
