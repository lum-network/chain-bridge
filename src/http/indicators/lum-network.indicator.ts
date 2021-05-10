import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { LumNetworkService } from '@app/services';

@Injectable()
export class LumNetworkIndicator extends HealthIndicator {
    constructor(private readonly _lumNetworkService: LumNetworkService) {
        super();
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            const clt = await this._lumNetworkService.getClient();
            const chainId = await clt.getChainId();
            return this.getStatus('lumnetwork', chainId === 'lumnetwork');
        } catch (error) {
            throw new HealthCheckError('Lum network ping failed', error);
        }
    }
}
