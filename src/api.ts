import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisOptions, Transport } from '@nestjs/microservices';

import { Queue } from 'bull';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import expressBasicAuth from 'express-basic-auth';

import * as parseRedisUrl from 'parse-redis-url-simple';

import { ApiModule } from '@app/modules';
import { Queues } from '@app/utils';

async function bootstrap() {
    // API module setup
    const app = await NestFactory.create(ApiModule, { bufferLogs: true });
    app.enableCors();
    // app.useLogger(app.get(Logger));

    // Microservice module setup
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    app.connectMicroservice<RedisOptions>(
        {
            transport: Transport.REDIS,
            options: {
                host: redisUrl[0].host,
                port: redisUrl[0].port,
                username: 'root',
                password: redisUrl[0].password,
                tls: {
                    rejectUnauthorized: false,
                    requestCert: true,
                },
            },
        },
        { inheritAppConfig: true },
    );

    // Acquire the config service
    const config = app.get(ConfigService);

    // Swagger
    const swagger = new DocumentBuilder().setTitle('Chain Bridge').setDescription('Opinionated blockchain bridge').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, document);

    // Configure BullBoard
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/_debug/queues');

    createBullBoard({
        queues: Object.values(Queues).map((queue) => new BullAdapter(app.get<Queue>(`BullQueue_${queue}`))),
        serverAdapter,
    });
    app.use(
        '/_debug/queues',
        expressBasicAuth({
            users: {
                admin: config.get<string>('BULLBOARD_PASSWORD'),
            },
            challenge: true,
        }),
        serverAdapter.getRouter(),
    );

    await app.startAllMicroservices();
    await app.listen(process.env.PORT || 3000);
}

bootstrap();
