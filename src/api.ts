import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisOptions, Transport } from '@nestjs/microservices';

import * as parseRedisUrl from 'parse-redis-url-simple';

import { ApiModule } from '@app/modules';

async function bootstrap() {
    // API module setup
    const app = await NestFactory.create(ApiModule);
    app.enableCors();

    // Microservice module setup
    const redisUrl = parseRedisUrl.parseRedisUrl(process.env.REDIS_URL);
    app.connectMicroservice<RedisOptions>(
        {
            transport: Transport.REDIS,
            options: {
                host: redisUrl[0].host,
                port: redisUrl[0].port,
                password: redisUrl[0].password,
            },
        },
        { inheritAppConfig: true },
    );

    // Acquire the config service
    const config = app.get(ConfigService);

    // Swagger
    const swagger = new DocumentBuilder().setTitle('Chain Bridge').setDescription('Opinionated blockchain bridge').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, document);

    await app.startAllMicroservices();
    await app.listen(config.get<string>('API_PORT'));
}

bootstrap();
