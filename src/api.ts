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
import { AsyncQueues } from '@app/async';

async function bootstrap() {
    // API module setup
    const app = await NestFactory.create(ApiModule);
    app.enableCors();

    // Microservice module setup
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    app.connectMicroservice<RedisOptions>(
        {
            transport: Transport.REDIS,
            options: {
                host: redisUrl[0].host,
                port: redisUrl[0].port,
                password: redisUrl[0].password,
                tls:
                    process.env.ENV === 'production'
                        ? {
                              rejectUnauthorized: false,
                          }
                        : null,
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
        queues: AsyncQueues.map((queue) => new BullAdapter(app.get<Queue>(`BullQueue_${queue.name}`))),
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
