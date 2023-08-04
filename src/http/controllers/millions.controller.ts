import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Req, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';
import { Deposit } from '@lum-network/sdk-javascript/build/codec/lum/network/millions/deposit';
import { Withdrawal } from '@lum-network/sdk-javascript/build/codec/lum/network/millions/withdrawal';

import { DataResponse, DataResponseMetadata, MillionsDepositResponse, MillionsDrawResponse, MillionsOutstandingPrizeResponse, MillionsPoolResponse, MillionsPrizeResponse, MillionsPrizeStatsResponse } from '@app/http';
import { ChainService, MillionsDepositService, MillionsDrawService, MillionsPoolService, MillionsPrizeService } from '@app/services';
import { AssetSymbol, ExplorerRequest } from '@app/utils';
import { LumChain } from '@app/services/chains';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(
        private readonly _chainService: ChainService,
        private readonly _millionsDepositService: MillionsDepositService,
        private readonly _millionsDrawService: MillionsDrawService,
        private readonly _millionsPoolService: MillionsPoolService,
        private readonly _millionsPrizeService: MillionsPrizeService,
    ) {}

    @ApiOkResponse({ status: 200, type: [MillionsPoolResponse] })
    @Get('pools')
    async pools(): Promise<DataResponse> {
        const pools = await this._millionsPoolService.fetch();

        return new DataResponse({
            result: pools.map((pool) => plainToInstance(MillionsPoolResponse, pool)),
        });
    }

    @ApiOkResponse({ status: 200, type: [MillionsOutstandingPrizeResponse] })
    @Get('pools/outstanding-prize')
    async poolsRewards(): Promise<DataResponse> {
        const pools = await this._millionsPoolService.fetch();

        const rewards = pools.map((pool) => {
            return {
                id: pool.id,
                available_prize_pool: pool.available_prize_pool,
                outstanding_prize_pool: pool.outstanding_prize_pool,
                sponsorship_amount: pool.sponsorship_amount,
            };
        });

        return new DataResponse({
            result: plainToInstance(MillionsOutstandingPrizeResponse, rewards),
        });
    }

    @ApiOkResponse({ status: 200, type: [MillionsDrawResponse] })
    @Get('draws')
    async draws(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [draws, total] = await this._millionsDrawService.fetch(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: draws.map((draw) => plainToInstance(MillionsDrawResponse, draw)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: draws.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: [MillionsPrizeResponse] })
    @Get('prizes')
    async prizes(@Req() request: ExplorerRequest): Promise<DataResponse> {
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

    @ApiOkResponse({ status: 200, type: [MillionsPrizeResponse] })
    @Get('prizes/biggest/:denom')
    async biggestPrizesByDenom(@Req() request: ExplorerRequest, @Param('denom') denom: string): Promise<DataResponse> {
        const [prizes, total] = await this._millionsPrizeService.fetchBiggestByDenom(denom, request.pagination.skip, request.pagination.limit);

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

    @ApiOkResponse({ status: 200, type: [MillionsPrizeResponse] })
    @Get('prizes/biggest')
    async biggestPrizes(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [prizes, total] = await this._millionsPrizeService.fetchBiggest(request.pagination.skip, request.pagination.limit);

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

    @ApiOkResponse({ status: 200, type: MillionsPrizeStatsResponse })
    @Get('prizes/stats/:denom')
    async prizeStatsByDenom(@Param('denom') denom: string): Promise<DataResponse> {
        const [biggestPrize, total] = await this._millionsPrizeService.fetchBiggestByDenom(denom, 0, 1);
        const totalPrizesAmount = await this._millionsPrizeService.fetchTotalAmountByDenom(denom);

        const biggestPrizeAmount = biggestPrize.length > 0 ? biggestPrize[0].amount.amount : 0;
        const totalPrizesUsdAmount = totalPrizesAmount.sum ? totalPrizesAmount.sum.toFixed(2) : '0';

        return new DataResponse({
            result: plainToInstance(MillionsPrizeStatsResponse, {
                total_pool_prizes: total,
                biggest_prize_amount: biggestPrizeAmount,
                total_prizes_usd_amount: totalPrizesUsdAmount,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsDepositResponse })
    @Get('deposits')
    async deposits(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [deposits, total] = await this._millionsDepositService.fetch(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: deposits.map((deposit) => plainToInstance(MillionsDepositResponse, deposit)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: deposits.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsDepositResponse })
    @Get('deposits/drops/:winnerAddress')
    async depositsByWinnerAddress(@Req() request: ExplorerRequest, @Param('winnerAddress') winnerAddress: string): Promise<DataResponse> {
        const [deposits, total] = await this._millionsDepositService.fetchDepositsDrops(winnerAddress, request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: deposits.map((deposit) => plainToInstance(MillionsDepositResponse, deposit)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: deposits.length,
                items_total: total,
            }),
        });
    }

    @Get('live/deposits')
    async liveDeposits(): Promise<DataResponse> {
        const chain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);

        // Acquire deposits
        let page = undefined;
        const deposits: Deposit[] = [];
        while (true) {
            const lDeps = await chain.client.queryClient.millions.deposits(page);
            deposits.push(...lDeps.deposits);

            if (lDeps.pagination && lDeps.pagination.nextKey && lDeps.pagination.nextKey.length > 0) {
                page = lDeps.pagination.nextKey;
            } else {
                break;
            }
        }

        return new DataResponse({
            result: deposits,
            metadata: new DataResponseMetadata({
                page: 0,
                limit: 0,
                items_count: deposits.length,
                items_total: deposits.length,
            }),
        });
    }

    @Get('live/withdrawals')
    async liveWithdrawals(): Promise<DataResponse> {
        const chain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);

        // Acquire deposits
        let page = undefined;
        const withdrawals: Withdrawal[] = [];
        while (true) {
            const lWdls = await chain.client.queryClient.millions.withdrawals(page);
            withdrawals.push(...lWdls.withdrawals);

            if (lWdls.pagination && lWdls.pagination.nextKey && lWdls.pagination.nextKey.length > 0) {
                page = lWdls.pagination.nextKey;
            } else {
                break;
            }
        }

        return new DataResponse({
            result: withdrawals,
            metadata: new DataResponseMetadata({
                page: 0,
                limit: 0,
                items_count: withdrawals.length,
                items_total: withdrawals.length,
            }),
        });
    }
}
