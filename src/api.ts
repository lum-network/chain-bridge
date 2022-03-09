import { NestFactory } from '@nestjs/core';

import { ApiModule } from '@app/modules';

async function bootstrap() {
    const app = await NestFactory.create(ApiModule);

    app.enableCors();

    await app.listen(3000);
}
bootstrap();
