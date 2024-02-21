import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as parseRedisUrl from 'parse-redis-url-simple';
import { Logger } from 'nestjs-pino';

import { SyncSchedulerModule } from '@app/modules';

async function bootstrap() {
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncSchedulerModule, {
        bufferLogs: true,
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
    });

    // app.useLogger(app.get(Logger));
    await app.listen();
}

bootstrap();
