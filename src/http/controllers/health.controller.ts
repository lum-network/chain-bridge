import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { LumNetworkIndicator } from '@app/http/indicators';

@Controller('health')
export class HealthController {
    constructor(
        private readonly _health: HealthCheckService,
        private readonly _lm: LumNetworkIndicator,
    ) {}

    @Get()
    @HealthCheck()
    async check() {
        return {
            result: await this._health.check([async () => this._lm.isHealthy()]),
        };
    }
}
