import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as parseRedisUrl from 'parse-redis-url-simple';

import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncConsumerModule, {
        transport: Transport.REDIS,
        options: {
            host: redisUrl[0].host,
            port: redisUrl[0].port,
            password: redisUrl[0].password,
            tls: {
                rejectUnauthorized: false,
            },
        },
    });

    await app.listen();
}

bootstrap();
