import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SyncSchedulerModule } from '@app/modules';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(SyncSchedulerModule, {
        transport: Transport.TCP,
    });
    await app.listen();
}

bootstrap();
