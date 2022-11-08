import { BadRequestException, Controller, Get, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { plainToInstance } from 'class-transformer';
import { fromUtf8, keyToHex } from '@lum-network/sdk-javascript/build/utils';

import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

import { LumNetworkService, BlockService, TransactionService } from '@app/services';
import { BalanceResponse, DataResponse, LumResponse } from '@app/http/responses';
import { GatewayWebsocket } from '@app/websocket';
import { CLIENT_PRECISION, MetricNames } from '@app/utils';

@ApiTags('core')
@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(
        @InjectMetric(MetricNames.COMMUNITY_POOL_SUPPLY) private readonly _communityPoolSupply: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_CURRENT_SUPPLY) private readonly _dfrCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_MA_BALANCE) private readonly _dfrMaBalance: Gauge<string>,
        @InjectMetric(MetricNames.LUM_CURRENT_SUPPLY) private readonly _lumCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_USD) private readonly _lumPriceUSD: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_EUR) private readonly _lumPriceEUR: Gauge<string>,
        @InjectMetric(MetricNames.MARKET_CAP) private readonly _marketCap: Gauge<string>,
        @InjectMetric(MetricNames.TWITTER_FOLLOWERS) private readonly _twitterFollowers: Gauge<string>,
        private readonly _blockService: BlockService,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _messageGateway: GatewayWebsocket,
        private readonly _transactionService: TransactionService,
    ) {}

    @ApiOkResponse({ status: 200, type: LumResponse })
    @Get('price')
    async price(): Promise<DataResponse> {
        const lumPrice = await this._lumNetworkService.getPrice();

        if (!lumPrice || !lumPrice.data || !lumPrice.data) {
            throw new BadRequestException('data_not_found');
        }

        // Compute the previous price
        const price = lumPrice.data.market_data.current_price.usd;
        let previousPrice = 0.0;
        const priceChange = String(lumPrice.data.market_data.price_change_24h);
        if (priceChange[0] === '-') {
            previousPrice = price + parseFloat(priceChange.split('-')[1]);
        } else {
            previousPrice = price - parseFloat(priceChange);
        }

        const res = {
            price: price,
            denom: lumPrice.data.platforms.cosmos,
            symbol: lumPrice.data.symbol.toUpperCase(),
            liquidity: 0.0,
            volume_24h: lumPrice.data.market_data.total_volume.usd,
            name: lumPrice.data.name,
            previous_day_price: previousPrice,
        };

        return {
            result: plainToInstance(LumResponse, res),
        };
    }

    @ApiOkResponse({ status: 200, type: [BalanceResponse] })
    @Get('assets')
    async assets(): Promise<DataResponse> {
        const assets = await this._lumNetworkService.client.queryClient.bank.totalSupply();
        return {
            result: assets.map((asset) => {
                return {
                    denom: asset.denom,
                    amount: parseInt(asset.amount, 10),
                };
            }),
        };
    }

    @Get('params')
    async params(): Promise<DataResponse> {
        const [chainId, mintingInflation, mintingParams, stakingParams, govDepositParams, govVoteParams, govTallyParams, distributionParams, slashingParams, communityPoolParams] = await Promise.all([
            this._lumNetworkService.client.getChainId(),
            this._lumNetworkService.client.queryClient.mint.inflation(),
            this._lumNetworkService.client.queryClient.mint.params(),
            this._lumNetworkService.client.queryClient.staking.params(),
            this._lumNetworkService.client.queryClient.gov.params('deposit'),
            this._lumNetworkService.client.queryClient.gov.params('voting'),
            this._lumNetworkService.client.queryClient.gov.params('tallying'),
            this._lumNetworkService.client.queryClient.distribution.params(),
            this._lumNetworkService.client.queryClient.slashing.params(),
            this._lumNetworkService.client.queryClient.distribution.communityPool(),
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
                        quorum: keyToHex(govTallyParams.tallyParams.quorum).toString(),
                        threshold: keyToHex(govTallyParams.tallyParams.threshold).toString(),
                        veto_threshold: keyToHex(govTallyParams.tallyParams.vetoThreshold).toString(),
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

    @MessagePattern('updateMetric')
    async updateMetric(@Payload() data: { name: string; value: number }): Promise<void> {
        if (data.name == MetricNames.LUM_CURRENT_SUPPLY) {
            await this._lumCurrentSupply.set(data.value);
        } else if (data.name == MetricNames.DFRACT_CURRENT_SUPPLY) {
            await this._dfrCurrentSupply.set(data.value);
        } else if (data.name == MetricNames.COMMUNITY_POOL_SUPPLY) {
            await this._communityPoolSupply.set(data.value);
        } else if (data.name == MetricNames.LUM_PRICE_USD) {
            await this._lumPriceUSD.set(data.value);
        } else if (data.name == MetricNames.LUM_PRICE_EUR) {
            await this._lumPriceEUR.set(data.value);
        } else if (data.name == MetricNames.DFRACT_MA_BALANCE) {
            await this._dfrMaBalance.set(data.value);
        } else if (data.name == MetricNames.MARKET_CAP) {
            await this._marketCap.set(data.value);
        } else if (data.name == MetricNames.TWITTER_FOLLOWERS) {
            await this._twitterFollowers.set(data.value);
        }
    }
}
