import { SharedBullAsyncConfiguration } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JOB_MAX_AGE } from '@app/utils';

export const QueueConfig: SharedBullAsyncConfiguration = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('REDIS_URL'),
        redis: {
            tls: {
                rejectUnauthorized: false,
                requestCert: true,
            },
        },
        limiter: {
            max: 1,
            duration: 30,
        },
        prefix: 'chain-bridge',
        defaultJobOptions: {
            removeOnComplete: {
                age: JOB_MAX_AGE,
            },
            removeOnFail: {
                age: JOB_MAX_AGE,
            },
        },
    }),
};
