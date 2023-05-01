import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, Controller, Get, Req, UseInterceptors } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';

import { MillionsPoolService, MillionsPrizeService } from '@app/services';

import { DataResponse, DataResponseMetadata, MillionsPoolResponse, MillionsPoolRewardsResponse, MillionsPrizeResponse } from '@app/http';
import { CLIENT_PRECISION, ExplorerRequest } from '@app/utils';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(private readonly _millionsPoolService: MillionsPoolService, private readonly _millionsPrizeService: MillionsPrizeService) {}

    @ApiOkResponse({ status: 200, type: [MillionsPoolResponse] })
    @Get('pools')
    async pools(): Promise<DataResponse> {
        const pools = await this._millionsPoolService.fetch();

        return new DataResponse({
            result: pools.map((pool) => plainToInstance(MillionsPoolResponse, pool)),
        });
    }

    @ApiOkResponse({ status: 200, type: [MillionsPoolRewardsResponse] })
    @Get('pools/rewards')
    async poolsRewards(): Promise<DataResponse> {
        const pools = await this._millionsPoolService.fetch();

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

    @ApiOkResponse({ status: 200, type: [MillionsPrizeResponse] })
    @Get('prizes')
    async prizes(@Req() request: ExplorerRequest): Promise<DataResponse> {
        console.log(request.pagination.skip, request.pagination.limit);
        const [prizes, total] = await this._millionsPrizeService.fetch(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: prizes.map((prize) => plainToInstance(MillionsPrizeResponse, prize)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: prizes.length,
                items_total: total,
            }),
        });
    }
}
