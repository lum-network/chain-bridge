import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import * as Sentry from '@sentry/node';

import { ApiModule } from '@app/modules';

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
        // API module setup
        const app = await NestFactory.create(ApiModule);
        app.enableCors();

        // Microservice module setup
        app.connectMicroservice<MicroserviceOptions>(
            {
                transport: Transport.REDIS,
                options: {
                    url: config.getRedisURL(),
                },
            },
            { inheritAppConfig: true },
        );

        await app.startAllMicroservices();
        await app.listen(config.getApiPort());
    } catch (e) {
        Sentry.captureException(e);
    }
}
bootstrap();
