import {Module} from '@nestjs/common';
import {ValidatorsController} from "@app/Http/Controllers";

@Module({
    imports: [],
    controllers: [ValidatorsController],
    providers: [],
})
export class AppModule {
}
