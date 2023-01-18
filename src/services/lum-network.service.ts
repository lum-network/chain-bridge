import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';

import { NewBlockEvent } from '@cosmjs/tendermint-rpc';
import { LumClient, LumConstants } from '@lum-network/sdk-javascript';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { QueryProposalsResponse } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/query';

import * as Sentry from '@sentry/node';

import moment from 'moment';
import { Stream } from 'xstream';
import { Queue } from 'bull';
import { lastValueFrom, map } from 'rxjs';

import {
    MODULE_NAMES,
    QueueJobs,
    QueuePriority,
    Queues,
    apy,
    TEN_EXPONENT_SIX,
    CLIENT_PRECISION,
    computeTotalTokenAmount,
    computeTotalApy,
    LUM_STAKING_ADDRESS,
    AssetSymbol,
    ApiUrl,
    LUM_ENV_CONFIG,
    GenericAssetInfo,
} from '@app/utils';

@Injectable()
export class LumNetworkService {
    private readonly _logger: Logger = new Logger(LumNetworkService.name);
    private readonly _currentModuleName: string = null;
    private _clientStream: Stream<NewBlockEvent> = null;
    private _client: LumClient = null;

    constructor(
        @InjectQueue(Queues.BLOCKS) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
        private readonly _modulesContainer: ModulesContainer,
    ) {
        // Lil hack to get the current module name
        for (const nestModule of this._modulesContainer.values()) {
            if (MODULE_NAMES.includes(nestModule.metatype.name)) {
                this._currentModuleName = nestModule.metatype.name;
                break;
            }
        }
    }

    initialize = async () => {
        try {
            this._client = await LumClient.connect(this._configService.get<string>(LUM_ENV_CONFIG).replace('https://', 'wss://').replace('http://', 'ws://'));
            const chainId = await this._client.getChainId();
            this._logger.log(`Connection established to Lum Network on ${this._configService.get<string>(LUM_ENV_CONFIG)} = ${chainId}`);

            // We only set the block listener in case of the sync scheduler module
            if (this._currentModuleName === 'SyncSchedulerModule') {
                this._clientStream = this._client.tmClient.subscribeNewBlock();
                this._clientStream.addListener({
                    next: async (ev: NewBlockEvent) => {
                        await this._queue.add(
                            QueueJobs.INGEST,
                            {
                                blockHeight: ev.header.height,
                                notify: true,
                            },
                            {
                                jobId: `${chainId}-block-${ev.header.height}`,
                                attempts: 5,
                                backoff: 60000,
                                priority: QueuePriority.HIGH,
                            },
                        );
                    },
                    error: (err: Error) => {
                        this._logger.error(`Failed to process the block event ${err}`);
                    },
                    complete: () => {
                        this._logger.error(`Stream completed before we had time to process`);
                    },
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    isInitialized = (): boolean => {
        return this._client !== null;
    };

    get client(): LumClient {
        return this._client;
    }

    getPrice = async (): Promise<any> => {
        try {
            return lastValueFrom(this._httpService.get(`${ApiUrl.GET_LUM_PRICE}`, { headers: { 'Accept-Encoding': '*' } }).pipe(map((response) => response.data)));
        } catch (error) {
            this._logger.error(`Could not fetch price for Lum Network...`, error);
            Sentry.captureException(error);
            return null;
        }
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any[]> => {
        try {
            const res = await this._httpService.get(`${ApiUrl.GET_LUM_PRICE}/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`).toPromise();
            return res.data.prices.map((price) => {
                return {
                    key: String(price[0]),
                    value: Number(price[1]),
                };
            });
        } catch (e) {
            return [];
        }
    };

    getProposals = async (): Promise<QueryProposalsResponse> => {
        try {
            // We want to sync all proposals and get the proposal_id
            const resultsProposals = await this.client.queryClient.gov.proposals(
                ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED |
                    ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD |
                    ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD |
                    ProposalStatus.PROPOSAL_STATUS_PASSED |
                    ProposalStatus.PROPOSAL_STATUS_REJECTED |
                    ProposalStatus.PROPOSAL_STATUS_FAILED |
                    ProposalStatus.UNRECOGNIZED,
                '',
                '',
            );

            return resultsProposals;
        } catch (error) {
            this._logger.error(`Failed to sync proposals from chain...`, error);
            Sentry.captureException(error);
            return null;
        }
    };

    getOpenVotingProposals = async (): Promise<any> => {
        try {
            const getProposals = await this.getProposals();

            const now = moment();

            const votingDateTime = getProposals.proposals
                .map((el) => ({
                    votingTime: el.votingEndTime,
                    proposalId: el.proposalId,
                }))
                .filter((el) => moment(el.votingTime) > now);

            if (!votingDateTime.length) {
                return [];
            }

            const getVotersByOpenProposalId = votingDateTime?.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);
            this._logger.log(`Fetched proposalId from open votes`, getVotersByOpenProposalId);

            return getVotersByOpenProposalId;
        } catch (error) {
            this._logger.error(`Failed to sync proposalsById...`, error);
            Sentry.captureException(error);
            return [];
        }
    };

    getTokenSupply = async (): Promise<number> => {
        try {
            return Number(convertUnit(await this.client.getSupply(LumConstants.MicroLumDenom), LumConstants.LumDenom));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Lum Network...`, error);
            Sentry.captureException(error);
            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            // We multiply the price by the supply to get the mcap
            const [supply, unit_price_usd] = await Promise.all([this.getTokenSupply(), this.getPrice()]);

            return supply * unit_price_usd.market_data.current_price.usd;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Lum Network...`, error);
            Sentry.captureException(error);
            return 0;
        }
    };

    getApy = async (): Promise<{ apy: number; symbol: string }> => {
        try {
            const inflation = Number(await this._client.queryClient.mint.inflation()) / CLIENT_PRECISION;
            const metrics = await computeTotalApy(this.client, Number(await this.getTokenSupply()), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            // See util files src/utils/dfract to see how we compute inflation

            return {
                apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio),
                symbol: AssetSymbol.LUM,
            };
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Lum Network...`, error);
            Sentry.captureException(error);
            return {apy: 0, symbol: 'ERROR'};
        }
    };

    getAllocatedToken = async (): Promise<number> => {
        try {
            const token = await computeTotalTokenAmount(LUM_STAKING_ADDRESS, this.client, LumConstants.MicroLumDenom, CLIENT_PRECISION, TEN_EXPONENT_SIX);
            return token;
        } catch (error) {
            this._logger.error('Failed to compute total allocated token for Lum...', error);
            Sentry.captureException(error);
            return 0;
        }
    };

    getAssetInfo = async (): Promise<GenericAssetInfo> => {
        try {
            // To compute metrics info we need lum's {unit_price_usd, total_value_usd, supply and apy, totalk_allocated_token}
            const [price, total_value_usd, supply, percentagYield, totalAllocatedToken] = await Promise.all([
                this.getPrice(),
                this.getMcap(),
                this.getTokenSupply(),
                this.getApy(),
                this.getAllocatedToken(),
            ]);

            return {
                unit_price_usd: price.market_data.current_price.usd,
                total_value_usd,
                supply,
                apy: percentagYield.apy,
                total_allocated_token: totalAllocatedToken,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Lum Network...', error);
            Sentry.captureException(error);
            return null;
        }
    };

    getTvl = async (): Promise<{ symbol: string; tvl: number }> => {
        try {
            // We compute the total token of lum based on the microdenum and staking address and get the current market price to calculate the tvl
            const [totalAllocatedToken, price] = await Promise.all([this.getAllocatedToken(), this.getPrice()]);

            return { tvl: totalAllocatedToken * price.market_data.current_price.usd, symbol: AssetSymbol.LUM };
        } catch (error) {
            this._logger.error('Failed to compute TVL for Lum Network...', error);
            Sentry.captureException(error);
            return { tvl: 0, symbol: 'ERROR' };
        }
    };
}
