import { BullModuleAsyncOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Queues } from '@app/utils';

export const AsyncQueues: BullModuleAsyncOptions[] = [
    {
        name: Queues.BEAMS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
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
                removeOnComplete: true,
                removeOnFail: true,
            },
        }),
    },
    {
        name: Queues.FAUCET,
        imports: [ConfigModule],
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
        inject: [ConfigService],
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
