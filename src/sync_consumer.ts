import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SyncConsumerModule } from '@app/modules';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(SyncConsumerModule, {
        transport: Transport.TCP,
    });
    await app.listen();
}

bootstrap();
