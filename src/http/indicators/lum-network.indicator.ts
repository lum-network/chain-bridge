import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { ChainService } from '@app/services';
import { AssetSymbol } from '@app/utils';

@Injectable()
export class LumNetworkIndicator extends HealthIndicator {
    constructor(private readonly _chainService: ChainService) {
        super();
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            const chainId = this._chainService.getChain(AssetSymbol.LUM).chainId;
            return this.getStatus('lumnetwork', chainId === 'lum-network-1');
        } catch (error) {
            throw new HealthCheckError('Lum network ping failed', error);
        }
    }
}
