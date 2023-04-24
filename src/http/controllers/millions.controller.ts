import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, Controller, Get, NotFoundException, UseInterceptors } from '@nestjs/common';
import { MillionsPoolsService } from '@app/services';
import { DataResponse } from '@app/http';
import { MillionsPoolsEntity } from '@app/database';
import Long from 'long';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(private readonly _millionsPoolsService: MillionsPoolsService) {}

    @ApiOkResponse({ status: 200, type: MillionsPoolsEntity })
    @Get('pools')
    async fetchPools(): Promise<any> {
        const pools = await this._millionsPoolsService.fetchAll();

        if (!pools) {
            throw new NotFoundException('pools_not_found');
        }

        return new DataResponse({
            result: pools,
        });
    }

    @Get('pools/rewards')
    async fetchPoolsRewards(): Promise<any> {
        const pools = await this._millionsPoolsService.fetchAll();

        if (!pools) {
            throw new NotFoundException('pools_not_found');
        }

        const rewards = pools.map((pool) => {
            return {
                pool_id: pool.pool_id,
                rewards: {
                    denom: pool.native_denom,

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
