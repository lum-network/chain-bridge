import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Req, UnprocessableEntityException, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

import bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { Withdrawal } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/withdrawal';
import { Deposit } from '@lum-network/sdk-javascript/build/codegen/lum/network/millions/deposit';
import { PageRequest } from '@lum-network/sdk-javascript/build/codegen/cosmos/base/query/v1beta1/pagination';

import {
    DataResponse,
    DataResponseMetadata,
    MillionsCampaignResponse,
    MillionsDepositorResponse,
    MillionsDepositResponse,
    MillionsDrawResponse,
    MillionsOutstandingPrizeResponse,
    MillionsPoolResponse,
    MillionsPrizeResponse,
    MillionsPrizeStatsResponse,
    MillionsBiggestWinnerResponse,
    MillionsCampaignParticipationRequest,
} from '@app/http';
import { ChainService, MillionsBiggestWinnerService, MillionsCampaignService, MillionsCampaignMemberService, MillionsDepositService, MillionsDepositorService, MillionsDrawService, MillionsPoolService, MillionsPrizeService } from '@app/services';
import { AssetSymbol, ExplorerRequest } from '@app/utils';
import { LumChain } from '@app/services/chains';

@ApiTags('millions')
@Controller('millions')
@UseInterceptors(CacheInterceptor)
export class MillionsController {
    constructor(
        private readonly _chainService: ChainService,
        private readonly _millionsBiggestWinnerService: MillionsBiggestWinnerService,
        private readonly _millionsCampaignService: MillionsCampaignService,
        private readonly _millionsCampaignMemberService: MillionsCampaignMemberService,
        private readonly _millionsDepositService: MillionsDepositService,
        private readonly _millionsDepositorService: MillionsDepositorService,
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
    @Get('prizes/address/:address')
    async prizesByAddress(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [prizes, total] = await this._millionsPrizeService.fetchByAddress(address, request.pagination.skip, request.pagination.limit);

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
    @Get('prizes/biggest/:poolId')
    async biggestPrizesByPoolId(@Req() request: ExplorerRequest, @Param('poolId') poolId: string): Promise<DataResponse> {
        const [prizes, total] = await this._millionsPrizeService.fetchBiggestByPoolId(poolId, request.pagination.skip, request.pagination.limit);

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

    @ApiOkResponse({ status: 200, type: [MillionsBiggestWinnerResponse] })
    @Get('prizes/biggest-apr')
    async biggestAprPrizes(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [prizes, total] = await this._millionsBiggestWinnerService.fetch(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: prizes.map((prize) => plainToInstance(MillionsBiggestWinnerResponse, prize)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: prizes.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsPrizeStatsResponse })
    @Get('prizes/stats/:poolId')
    async prizeStatsByPoolId(@Param('poolId') poolId: string): Promise<DataResponse> {
        const [biggestPrize, total] = await this._millionsPrizeService.fetchBiggestByPoolId(poolId, 0, 1);
        const totalPrizesAmount = await this._millionsPrizeService.getTotalAmountByPoolId(poolId);

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

    @ApiOkResponse({ status: 200, type: MillionsDepositorResponse })
    @Get('depositors/:poolId')
    async depositorsByPoolId(@Req() request: ExplorerRequest, @Param('poolId') poolId: number): Promise<DataResponse> {
        const [depositors, total] = await this._millionsDepositorService.fetchByPoolId(poolId, request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: depositors.map((deposit) => plainToInstance(MillionsDepositorResponse, deposit)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: depositors.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsDepositorResponse })
    @Get('depositors/:poolId/:address')
    async depositorsByPoolIdAndAddress(@Req() request: ExplorerRequest, @Param('poolId') poolId: number, @Param('address') address: string): Promise<DataResponse> {
        const depositor = await this._millionsDepositorService.getByPoolIdAndAddress(poolId, address);

        if (!depositor) {
            throw new NotFoundException('Depositor not found');
        }

        const before = await this._millionsDepositorService.getByPoolIdAndRank(poolId, depositor.rank - 1);
        const after = await this._millionsDepositorService.getByPoolIdAndRank(poolId, depositor.rank + 1);

        const depositors = [before, depositor, after];

        return new DataResponse({
            result: depositors.map((deposit) => plainToInstance(MillionsDepositorResponse, deposit)),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsCampaignResponse })
    @Get('campaigns')
    async campaigns(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [campaigns, total] = await this._millionsCampaignService.fetch(request.pagination.skip, request.pagination.limit);

        return new DataResponse({
            result: campaigns.map((campaign) => plainToInstance(MillionsCampaignResponse, campaign)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: campaigns.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsCampaignResponse })
    @Get('campaigns/:id')
    async campaignById(@Param('id') id: string): Promise<DataResponse> {
        const campaign = await this._millionsCampaignService.getById(id);

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        return new DataResponse({
            result: plainToInstance(MillionsCampaignResponse, campaign),
        });
    }

    @ApiOkResponse({ status: 200, type: MillionsCampaignResponse })
    @Post('campaigns/participate')
    async participateCampaign(@Body() body: MillionsCampaignParticipationRequest): Promise<DataResponse> {
        const campaign = await this._millionsCampaignService.getById(body.campaign_id);

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (!(await bcrypt.compare(body.password, campaign.password))) {
            throw new ForbiddenException('Password is incorrect');
        }

        if (await this._millionsCampaignMemberService.getByCampaignIdAndWalletAddress(body.campaign_id, body.wallet_address)) {
            throw new UnprocessableEntityException('You already participated in this campaign');
        }

        await this._millionsCampaignMemberService.save({
            campaign_id: body.campaign_id,
            wallet_address: body.wallet_address,
            campaign: campaign,
        });

        return new DataResponse({
            result: plainToInstance(MillionsCampaignResponse, campaign),
        });
    }

    @Get('live/deposits')
    async liveDeposits(): Promise<DataResponse> {
        const chain = this._chainService.getChain<LumChain>(AssetSymbol.LUM);

        // Acquire deposits
        let nextPageKey: Uint8Array = new Uint8Array();
        const deposits: Deposit[] = [];
        while (true) {
            const lDeps = await chain.client.lum.network.millions.deposits({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    offset: BigInt(0),
                    limit: BigInt(100),
                    reverse: false,
                    countTotal: false,
                }),
            });
            deposits.push(...lDeps.deposits);

            if (lDeps.pagination && lDeps.pagination.nextKey && lDeps.pagination.nextKey.length > 0) {
                nextPageKey = lDeps.pagination.nextKey;
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
        let nextPageKey: Uint8Array = new Uint8Array();
        const withdrawals: Withdrawal[] = [];
        while (true) {
            const lWdls = await chain.client.lum.network.millions.withdrawals({
                pagination: PageRequest.fromPartial({
                    key: nextPageKey,
                    offset: BigInt(0),
                    limit: BigInt(100),
                    reverse: false,
                    countTotal: false,
                }),
            });
            withdrawals.push(...lWdls.withdrawals);

            if (lWdls.pagination && lWdls.pagination.nextKey && lWdls.pagination.nextKey.length > 0) {
                nextPageKey = lWdls.pagination.nextKey;
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
