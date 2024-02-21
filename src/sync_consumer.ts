import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as parseRedisUrl from 'parse-redis-url-simple';
import { Logger } from 'nestjs-pino';

import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncConsumerModule, {
        bufferLogs: true,
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

    // app.useLogger(app.get(Logger));
    await app.listen();
}

bootstrap();
