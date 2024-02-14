import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as parseRedisUrl from 'parse-redis-url-simple';

import { SyncSchedulerModule } from '@app/modules';

async function bootstrap() {
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncSchedulerModule, {
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
    });

    await app.listen();
}

bootstrap();
