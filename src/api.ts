import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as Sentry from '@sentry/node';

import { ApiModule } from '@app/modules';

async function bootstrap() {
    try {
        // API module setup
        const app = await NestFactory.create(ApiModule);
        app.enableCors();

        // Microservice module setup
        app.connectMicroservice<RedisOptions>(
            {
                transport: Transport.REDIS,
                options: {
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT, 10),
                },
            },
            { inheritAppConfig: true },
        );

        const config = app.get(ConfigService);

        // Sentry DSN
        const sentryDsn = config.get<string>('SENTRY_DSN');
        if (sentryDsn) {
            Sentry.init({
                dsn: sentryDsn,
                tracesSampleRate: 1.0,
            });
        }

        // Swagger
        const swagger = new DocumentBuilder().setTitle('Chain Bridge').setDescription('Opinionated blockchain bridge').setVersion('1.0').build();
        const document = SwaggerModule.createDocument(app, swagger);
        SwaggerModule.setup('docs', app, document);

        await app.startAllMicroservices();
        await app.listen(config.get<string>('API_PORT'));
    } catch (e) {
        Sentry.captureException(e);
    }
}

bootstrap();
