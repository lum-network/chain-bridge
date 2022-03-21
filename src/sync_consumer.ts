import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import * as Sentry from '@sentry/node';

import { SyncConsumerModule } from '@app/modules';

import { config } from '@app/utils';

async function bootstrap() {
    // Sentry DSN
    const sentryDsn = config.getSentryDsn();
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            tracesSampleRate: 1.0,
        });
    }

    try {
        const app = await NestFactory.createMicroservice<MicroserviceOptions>(SyncConsumerModule, {
            transport: Transport.REDIS,
            options: {
                url: config.getRedisURL(),
            },
        });
        await app.listen();
    } catch (e) {
        Sentry.captureException(e);
    }
}

bootstrap();
