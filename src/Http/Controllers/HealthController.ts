import {Controller, Get} from "@nestjs/common";
import {HealthCheck, HealthCheckService} from "@nestjs/terminus";
import {ElasticsearchIndicator} from "@app/Http/Indicators";

@Controller('health')
export default class HealthController {
    constructor(private readonly _health: HealthCheckService, private readonly _es: ElasticsearchIndicator) {
    }

    @Get()
    @HealthCheck()
    check() {
        return this._health.check([
            async () => this._es.isHealthy()
        ]);
    }
}
