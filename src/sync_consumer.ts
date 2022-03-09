import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { SyncConsumerModule } from '@app/modules';

import { config } from '@app/utils';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(SyncConsumerModule, {
        transport: Transport.REDIS,
        options: {
            url: config.getRedisURL(),
        },
    });
    await app.listen();
}

bootstrap();
