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
            redis:
                configService.get<string>('ENV') === 'production'
                    ? {
                          tls: {
                              rejectUnauthorized: false,
                          },
                      }
                    : {},
            limiter: {
                max: 1,
                duration: 30,
            },
            defaultJobOptions: {
                removeOnComplete: true,
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
            redis:
                configService.get<string>('ENV') === 'production'
                    ? {
                          tls: {
                              rejectUnauthorized: false,
                          },
                      }
                    : {},
            defaultJobOptions: {
                removeOnComplete: true,
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
            redis:
                configService.get<string>('ENV') === 'production'
                    ? {
                          tls: {
                              rejectUnauthorized: false,
                          },
                      }
                    : {},
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
            },
        }),
    },
    {
        name: Queues.MILLIONS_DEPOSITS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            url: configService.get<string>('REDIS_URL'),
            redis:
                configService.get<string>('ENV') === 'production'
                    ? {
                          tls: {
                              rejectUnauthorized: false,
                          },
                      }
                    : {},
            defaultJobOptions: {
                removeOnComplete: true,
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
            redis:
                configService.get<string>('ENV') === 'production'
                    ? {
                          tls: {
                              rejectUnauthorized: false,
                          },
                      }
                    : {},
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
