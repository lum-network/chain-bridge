import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';

import { NewBlockEvent } from '@cosmjs/tendermint-rpc';
import { LumClient } from '@lum-network/sdk-javascript';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import moment from 'moment';
import { Stream } from 'xstream';
import { Queue } from 'bull';

import { DfractAssetSymbol, DfractAssetName, MODULE_NAMES, QueueJobs, QueuePriority, Queues, apy, TEN_EXPONENT_SIX, CLIENT_PRECISION, computeTotalAmount, computeApyMetrics } from '@app/utils';
import { lastValueFrom, map } from 'rxjs';
import { convertUnit } from '@lum-network/sdk-javascript/build/utils';
import { TokenInfo } from '@app/http';

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
            const getPrice = await lastValueFrom(this._httpService.get(`https://api-osmosis.imperator.co/tokens/v2/price/lum`).pipe(map((response) => response.data.price)));

            return getPrice;
        } catch (error) {
            this._logger.error(`Could not fetch price from Kichain...`);
        }
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

    getTokenSupply = async (): Promise<number> => {
        try {
            const getTokenSupply = Number(convertUnit(await this.client.getSupply('ulum'), 'lum'));

            return getTokenSupply;
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Lum Network...`);
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            const getMcap = Promise.all([await this.getTokenSupply(), await this.getPrice()]).then(([supply, unitPriceUsd]) => Number(supply) * Number(unitPriceUsd));

            return getMcap;
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Lum Network...`);
        }
    };

    getApy = async (): Promise<number> => {
        try {
            const metrics = await computeApyMetrics(this.client, Number(await this.getTokenSupply()), CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const getLumApy = apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio);

            return getLumApy;
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Lum Network...`);
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            const getSentinelTokenInfo = await Promise.all([await this.getPrice(), await this.getMcap(), await this.getTokenSupply(), await this.getApy()]).then(
                ([unitPriceUsd, totalValueUsd, supply, apy]) => ({ unitPriceUsd, totalValueUsd, supply, apy }),
            );

            return {
                name: DfractAssetName.LUM,
                symbol: DfractAssetSymbol.LUM,
                ...getSentinelTokenInfo,
            };
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Lum Network...', error);
        }
    };

    getTvl = async (): Promise<number> => {
        try {
            const totalToken = await computeTotalAmount('lum', this.client, 'ulum', CLIENT_PRECISION, TEN_EXPONENT_SIX);

            const computedTvl = Number(totalToken) * Number(await this.getPrice());

            return computedTvl;
        } catch (error) {
            this._logger.error('Failed to compute TVL for Lum Network...', error);
        }
    };
}
