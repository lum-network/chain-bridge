import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';

import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<RedisOptions>(SyncConsumerModule, {
        transport: Transport.REDIS,
        options: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
        },
    });

    await app.listen();
}

bootstrap();
