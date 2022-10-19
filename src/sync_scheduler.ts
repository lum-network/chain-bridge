import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as Sentry from '@sentry/node';

import { SyncSchedulerModule } from '@app/modules';

async function bootstrap() {
    try {
        const app = await NestFactory.createMicroservice<RedisOptions>(SyncSchedulerModule, {
            transport: Transport.REDIS,
            options: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT, 10),
            },
        });

        const config = app.get(ConfigService);

        // Sentry DSN
        const sentryDsn = config.get<string>('SENTRY_DSN');
        if (sentryDsn) {
            Sentry.init({
                dsn: sentryDsn,
                tracesSampleRate: 1.0,
            });
        }

        await app.listen();
    } catch (e) {
        Sentry.captureException(e);
    }
}

bootstrap();
