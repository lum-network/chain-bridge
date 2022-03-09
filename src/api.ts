import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { ApiModule } from '@app/modules';

import { config } from '@app/utils';

async function bootstrap() {
    // API module setup
    const app = await NestFactory.create(ApiModule);
    app.enableCors();

    // Microservice module setup
    app.connectMicroservice<MicroserviceOptions>(
        {
            transport: Transport.REDIS,
            options: {
                url: config.getRedisURL(),
            },
        },
        { inheritAppConfig: true },
    );

    await app.startAllMicroservices();
    await app.listen(3000);
}
bootstrap();
