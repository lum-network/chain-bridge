import { ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';

import { MillionsPoolsService } from '@app/services';
import { DataResponse } from '@app/http';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(private readonly _millionsPoolsService: MillionsPoolsService) {}

    @Get('pools')
    async pools(): Promise<any> {
        const pools = await this._millionsPoolsService.fetch();

        return new DataResponse({
            result: pools,
        });
    }

    @Get('pools/rewards')
    async poolsRewards(): Promise<any> {
        const pools = await this._millionsPoolsService.fetch();

        const rewards: any[] = pools.map((pool) => {
            return {
                pool_id: pool.id,
                rewards: {
                    denom: pool.denom_native,

                    // Sum all rewards for each validator
                    amount: pool.validators
                        .reduce((acc, validator) => {
                            return acc + BigInt(validator.rewards_amount[0]?.amount ?? 0);
                        }, BigInt(0))
                        .toString(),
                },
            };
        });

        return new DataResponse({
            result: rewards,
        });
    }
}
