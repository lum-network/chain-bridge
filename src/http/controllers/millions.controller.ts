import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';

import { MillionsPoolsService } from '@app/services';

import { DataResponse, MillionsPoolResponse, MillionsPoolRewardsResponse } from '@app/http';
import { CLIENT_PRECISION } from '@app/utils';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(private readonly _millionsPoolsService: MillionsPoolsService) {}

    @ApiOkResponse({ status: 200, type: [MillionsPoolResponse] })
    @Get('pools')
    async pools(): Promise<DataResponse> {
        const pools = await this._millionsPoolsService.fetch();

        return new DataResponse({
            result: pools.map((pool) => plainToInstance(MillionsPoolResponse, pool)),
        });
    }

    @ApiOkResponse({ status: 200, type: [MillionsPoolRewardsResponse] })
    @Get('pools/rewards')
    async poolsRewards(): Promise<DataResponse> {
        const pools = await this._millionsPoolsService.fetch();

        const rewards = pools.map((pool) => {
            return {
                id: pool.id,
                available_prize_pool: pool.available_prize_pool,
                rewards: {
                    denom: pool.denom_native,

                    // Sum all rewards for each validator
                    amount: Math.ceil(
                        pool.validators.reduce((acc, validator) => {
                            return acc + parseInt(validator.rewards_amount[0]?.amount ?? '0', 10) / CLIENT_PRECISION;
                        }, 0),
                    ),
                },
            };
        });

        return new DataResponse({
            result: plainToInstance(MillionsPoolRewardsResponse, rewards),
        });
    }
}
