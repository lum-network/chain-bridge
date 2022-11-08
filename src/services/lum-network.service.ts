import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';

import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

import { NewBlockEvent } from '@cosmjs/tendermint-rpc';
import { LumClient } from '@lum-network/sdk-javascript';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import moment from 'moment';
import { Stream } from 'xstream';
import { Queue } from 'bull';

import { CLIENT_PRECISION, MetricNames, MODULE_NAMES, QueueJobs, QueuePriority, Queues } from '@app/utils';

@Injectable()
export class LumNetworkService {
    private _client: LumClient = null;
    private _clientStream: Stream<NewBlockEvent> = null;
    private readonly _currentModuleName: string = null;
    private readonly _logger: Logger = new Logger(LumNetworkService.name);

    constructor(
        @InjectMetric(MetricNames.COMMUNITY_POOL_SUPPLY) private readonly _communityPoolSupply: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_CURRENT_SUPPLY) private readonly _dfrCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.DFRACT_MA_BALANCE) private readonly _dfrMaBalance: Gauge<string>,
        @InjectMetric(MetricNames.LUM_CURRENT_SUPPLY) private readonly _lumCurrentSupply: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_USD) private readonly _lumPriceUSD: Gauge<string>,
        @InjectMetric(MetricNames.LUM_PRICE_EUR) private readonly _lumPriceEUR: Gauge<string>,
        @InjectMetric(MetricNames.MARKET_CAP) private readonly _marketCap: Gauge<string>,
        @InjectMetric(MetricNames.TWITTER_FOLLOWERS) private readonly _twitterFollowers: Gauge<string>,
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

    initialise = async () => {
        try {
            this._client = await LumClient.connect(this._configService.get<string>('LUM_NETWORK_ENDPOINT').replace('https://', 'wss://').replace('http://', 'ws://'));
            const chainId = await this._client.getChainId();
            this._logger.log(`Connection established to Lum Network on ${this._configService.get<string>('LUM_NETWORK_ENDPOINT')} = ${chainId}`);

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
            } else if (this._currentModuleName === 'ApiModule') {
                // We only set the metrics in case of the api module
                // Those are computed at each block event
                this._clientStream = this._client.tmClient.subscribeNewBlock();
                this._clientStream.addListener({
                    next: async () => {
                        // Acquire data
                        const [dfrSupply, lumSupply] = await Promise.all([this.client.queryClient.bank.supplyOf('udfr'), this.client.queryClient.bank.supplyOf('ulum')]);
                        const [communityPool] = await Promise.all([this.client.queryClient.distribution.communityPool()]);
                        const [dfrBalance] = await Promise.all([this.client.queryClient.dfract.getAccountBalance()]);
                        const price = await this.getPrice();

                        // Compute data
                        const communityPoolSupply = communityPool.pool.find((coin) => coin.denom === 'ulum');

                        // Update metrics
                        await this._dfrCurrentSupply.set(parseInt(dfrSupply.amount, 10));
                        await this._lumCurrentSupply.set(parseInt(lumSupply.amount, 10));
                        await this._communityPoolSupply.set(parseInt(communityPoolSupply.amount, 10) / CLIENT_PRECISION);
                        await this._lumPriceUSD.set(price.data.market_data.current_price.usd);
                        await this._lumPriceEUR.set(price.data.market_data.current_price.eur);
                        await this._dfrMaBalance.set(dfrBalance.map((balance) => parseInt(balance.amount, 10)).reduce((a, b) => a + b, 0));
                        await this._marketCap.set(parseInt(lumSupply.amount, 10) * price.data.market_data.current_price.usd);
                        await this._twitterFollowers.set(price.data.community_data.twitter_followers);
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

    get moduleName(): string {
        return this._currentModuleName;
    }

    get client(): LumClient {
        return this._client;
    }

    getPrice = (): Promise<any> => {
        return this._httpService.get(`https://api.coingecko.com/api/v3/coins/lum-network`).toPromise();
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any> => {
        try {
            const res = await this._httpService.get(`https://api.coingecko.com/api/v3/coins/lum-network/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`).toPromise();
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

    async getProposals() {
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
        }
    }

    async getOpenVotingProposals() {
        try {
            const getProposals = await this.getProposals();

            const now = moment();

            const votingDateTime = getProposals.proposals
                .map((el) => ({
                    votingTime: el.votingEndTime,
                    proposalId: el.proposalId,
                }))
                .filter((el) => moment(el.votingTime) > now);

            if (votingDateTime.length) {
                const getVotersByOpenProposalId = votingDateTime?.map((proposal) => proposal.proposalId).map((longInt) => longInt.low);
                this._logger.log(`Fetched proposalId from open votes`, getVotersByOpenProposalId);

                return getVotersByOpenProposalId;
            } else {
                this._logger.log(`No current open proposals to vote on...`);
            }
        } catch (error) {
            this._logger.error(`Failed to sync proposalsById...`, error);
        }
    }
}
