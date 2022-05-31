import { NestFactory } from '@nestjs/core';
import {ConfigService} from "@nestjs/config";
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import * as Sentry from '@sentry/node';

import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    try {
        const app = await NestFactory.createMicroservice<MicroserviceOptions>(SyncConsumerModule, {
            transport: Transport.REDIS,
            options: {
                url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
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
