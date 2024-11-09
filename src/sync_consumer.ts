import './instrument';
import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncConsumerModule, {
        bufferLogs: true,
        transport: Transport.REDIS,
        options: {
            host: redisUrl.hostname,
            port: parseInt(redisUrl.port),
            username: redisUrl.username,
            password: redisUrl.password,
            tls:
                process.env.ENV === 'production'
                    ? {
                          rejectUnauthorized: false,
                          requestCert: true,
                      }
                    : null,
        },
    });

    await app.listen();
}

bootstrap();
