import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from '@app/utils/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(config.getApiPort());
}
bootstrap();
