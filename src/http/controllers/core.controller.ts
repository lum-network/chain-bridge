import {
    BadRequestException,
    Controller,
    Get,
    Logger,
} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";
import {ConfigService} from "@nestjs/config";
import {MessagePattern, Payload} from '@nestjs/microservices';

import {plainToInstance} from 'class-transformer';

import {LumNetworkService, BlockService, TransactionService} from '@app/services';
import {DataResponse, LumResponse} from '@app/http/responses';
import {GatewayWebsocket} from '@app/websocket';
import {keyToHex} from "@lum-network/sdk-javascript/build/utils";

@ApiTags('core')
@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(
        private readonly _blockService: BlockService,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _messageGateway: GatewayWebsocket,
        private readonly _transactionService: TransactionService
    ) {
    }

    @ApiOkResponse({status: 200, type: LumResponse})
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
            previous_day_price: previousPrice
        };

        return {
            result: plainToInstance(LumResponse, res)
        };
    }

    @Get('params')
    async params(): Promise<DataResponse> {
        const [mintingParams, stakingParams, govDepositParams, govVoteParams, govTallyParams, distributionParams, slashingParams] = await Promise.all([
            this._lumNetworkService.client.queryClient.mint.params(),
            this._lumNetworkService.client.queryClient.staking.params(),
            this._lumNetworkService.client.queryClient.gov.params("deposit"),
            this._lumNetworkService.client.queryClient.gov.params("voting"),
            this._lumNetworkService.client.queryClient.gov.params('tallying'),
            this._lumNetworkService.client.queryClient.distribution.params(),
            this._lumNetworkService.client.queryClient.slashing.params()
        ]);
        return {
            result: {
                mint: {
                    denom: mintingParams.mintDenom,
                    inflation: {
                        rate_change: mintingParams.inflationRateChange,
                        max: mintingParams.inflationMax,
                        min: mintingParams.inflationMin
                    },
                    goal_bonded: mintingParams.goalBonded,
                    blocks_per_year: mintingParams.blocksPerYear.low
                },
                staking: {
                    max_validators: stakingParams.params.maxValidators,
                    max_entries: stakingParams.params.maxEntries,
                    historical_entries: stakingParams.params.historicalEntries,
                    denom: stakingParams.params.bondDenom,
                    unbonding_time: stakingParams.params.unbondingTime.seconds.low
                },
                gov: {
                    vote: {
                        period: govVoteParams.votingParams.votingPeriod.seconds.low
                    },
                    deposit: {
                        minimum: govDepositParams.depositParams.minDeposit,
                        period: govDepositParams.depositParams.maxDepositPeriod.seconds.low
                    },
                    tally: {
                        quorum: keyToHex(govTallyParams.tallyParams.quorum).toString(),
                        threshold: keyToHex(govTallyParams.tallyParams.threshold).toString(),
                        veto_threshold: keyToHex(govTallyParams.tallyParams.vetoThreshold).toString()
                    }
                },
                distribution: {
                    community_tax: distributionParams.params.communityTax,
                    base_proposer_reward: distributionParams.params.baseProposerReward,
                    bonus_proposer_reward: distributionParams.params.bonusProposerReward,
                    withdraw_address_enabled: distributionParams.params.withdrawAddrEnabled
                },
                slashing: {
                    signed_blocks_window: slashingParams.params.signedBlocksWindow.low,
                    min_signed_per_window: keyToHex(slashingParams.params.minSignedPerWindow),
                    slash_fraction_double_sign: keyToHex(slashingParams.params.slashFractionDoubleSign).toString(),
                    slash_fraction_downtime: keyToHex(slashingParams.params.slashFractionDowntime).toString(),
                    downtime_jail_duration: slashingParams.params.downtimeJailDuration.seconds.low
                }
            }
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
