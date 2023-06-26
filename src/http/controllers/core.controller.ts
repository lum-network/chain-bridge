import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';
import { fromUtf8 } from '@lum-network/sdk-javascript/build/utils';

import { ChainService } from '@app/services';
import { BalanceResponse, DataResponse, LumResponse } from '@app/http/responses';
import { GatewayWebsocket } from '@app/websocket';
import { AssetSymbol, CLIENT_PRECISION, MetricNames } from '@app/utils';
import { LumChain } from '@app/services/chains';

@ApiTags('core')
@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(private readonly _chainService: ChainService, private readonly _messageGateway: GatewayWebsocket) {}

    @UseInterceptors(CacheInterceptor)
    @ApiOkResponse({ status: 200, type: LumResponse })
    @Get('price')
    async price(): Promise<DataResponse> {
        const [price, totalVolume, priceChange24h] = await Promise.all([
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPrice(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getTotalVolume(),
            this._chainService.getChain<LumChain>(AssetSymbol.LUM).getPriceChange(),
        ]);

        // Compute the previous price
        let previousPrice = 0.0;
        const priceChange = String(priceChange24h);
        if (priceChange[0] === '-') {
            previousPrice = price + parseFloat(priceChange.split('-')[1]);
        } else {
            previousPrice = price - parseFloat(priceChange);
        }

        const res = {
            price: price,
            denom: 'ibc/8A34AF0C1943FD0DFCDE9ADBF0B2C9959C45E87E6088EA2FC6ADACD59261B8A2',
            symbol: 'LUM',
            liquidity: 0.0,
            volume_24h: totalVolume,
            name: 'Lum Network',
            previous_day_price: previousPrice,
        };

        return {
            result: plainToInstance(LumResponse, res),
        };
    }

    @UseInterceptors(CacheInterceptor)
    @ApiOkResponse({ status: 200, type: [BalanceResponse] })
    @Get('assets')
    async assets(): Promise<DataResponse> {
        const assets = await this._chainService.getChain(AssetSymbol.LUM).client.queryClient.bank.totalSupply();
        return {
            result: assets.map((asset) => {
                return {
                    denom: asset.denom,
                    amount: parseInt(asset.amount, 10),
                };
            }),
        };
    }

    @UseInterceptors(CacheInterceptor)
    @Get('params')
    async params(): Promise<DataResponse> {
        const [chainId, mintingInflation, mintingParams, stakingParams, govDepositParams, govVoteParams, govTallyParams, distributionParams, slashingParams, communityPoolParams] = await Promise.all([
            this._chainService.getChain(AssetSymbol.LUM).client.getChainId(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.mint.inflation(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.mint.params(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.staking.params(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.gov.params('deposit'),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.gov.params('voting'),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.gov.params('tallying'),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.distribution.params(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.slashing.params(),
            this._chainService.getChain(AssetSymbol.LUM).client.queryClient.distribution.communityPool(),
        ]);
        return {
            result: {
                chain_id: chainId,
                mint: {
                    denom: mintingParams.mintDenom,
                    inflation: {
                        rate_change: parseInt(mintingParams.inflationRateChange, 10) / CLIENT_PRECISION,
                        max: parseInt(mintingParams.inflationMax, 10) / CLIENT_PRECISION,
                        min: parseInt(mintingParams.inflationMin, 10) / CLIENT_PRECISION,
                        current: parseInt(mintingInflation, 10) / CLIENT_PRECISION,
                    },
                    goal_bonded: parseInt(mintingParams.goalBonded, 10) / CLIENT_PRECISION,
                    blocks_per_year: mintingParams.blocksPerYear.low,
                },
                staking: {
                    max_validators: stakingParams.params.maxValidators,
                    max_entries: stakingParams.params.maxEntries,
                    historical_entries: stakingParams.params.historicalEntries,
                    denom: stakingParams.params.bondDenom,
                    unbonding_time: stakingParams.params.unbondingTime.seconds.low,
                },
                gov: {
                    vote: {
                        period: govVoteParams.votingParams.votingPeriod.seconds.low,
                    },
                    deposit: {
                        minimum: govDepositParams.depositParams.minDeposit.map((bal) => {
                            return {
                                denom: bal.denom,
                                amount: parseInt(bal.amount, 10),
                            };
                        }),
                        period: govDepositParams.depositParams.maxDepositPeriod.seconds.low,
                    },
                    tally: {
                        quorum: govTallyParams.tallyParams.quorum,
                        threshold: govTallyParams.tallyParams.threshold,
                        veto_threshold: govTallyParams.tallyParams.vetoThreshold,
                    },
                },
                distribution: {
                    community_tax: parseInt(distributionParams.params.communityTax, 10) / CLIENT_PRECISION,
                    base_proposer_reward: parseInt(distributionParams.params.baseProposerReward, 10) / CLIENT_PRECISION,
                    bonus_proposer_reward: parseInt(distributionParams.params.bonusProposerReward, 10) / CLIENT_PRECISION,
                    withdraw_address_enabled: distributionParams.params.withdrawAddrEnabled,
                    community_pool: communityPoolParams.pool.map((p) => {
                        return {
                            denom: p.denom,
                            amount: parseInt(p.amount, 10) / CLIENT_PRECISION,
                        };
                    }),
                },
                slashing: {
                    signed_blocks_window: slashingParams.params.signedBlocksWindow.low,
                    min_signed_per_window: parseInt(fromUtf8(slashingParams.params.minSignedPerWindow), 10) / CLIENT_PRECISION,
                    slash_fraction_double_sign: parseInt(fromUtf8(slashingParams.params.slashFractionDoubleSign), 10) / CLIENT_PRECISION,
                    slash_fraction_downtime: parseInt(fromUtf8(slashingParams.params.slashFractionDowntime), 10) / CLIENT_PRECISION,
                    downtime_jail_duration: slashingParams.params.downtimeJailDuration.seconds.low,
                },
            },
        };
    }

    @MessagePattern('notifySocket')
    async notifySocket(@Payload() data: { channel: string; event: string; data: string }): Promise<void> {
        this._logger.log(`Dispatching notification on channel ${data.channel}...`);
        if (this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(data.channel).emit(data.event, data.data);
        }
    }
}
