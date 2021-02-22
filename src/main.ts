import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {config} from "@app/Utils/Config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(config.getValue<number>('PORT') || 3000);
}
bootstrap();
