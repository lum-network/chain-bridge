import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';

import { NewBlockEvent } from '@cosmjs/tendermint-rpc';
import { LumClient, LumConstants, LumUtils } from '@lum-network/sdk-javascript';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import moment from 'moment';
import { Stream } from 'xstream';
import { Queue } from 'bull';

import {
    MODULE_NAMES,
    QueueJobs,
    QueuePriority,
    Queues,
    apy,
    TEN_EXPONENT_SIX,
    CLIENT_PRECISION,
    computeTotalAmount,
    computeApyMetrics,
    LUM_STAKING_ADDRESS,
    AssetPrefix,
    AssetSymbol,
} from '@app/utils';
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

    getPriceLum = async (): Promise<number> => {
        try {
            return await lastValueFrom(this._httpService.get(`https://api.coingecko.com/api/v3/coins/lum-network`).pipe(map((response) => response.data.market_data.current_price.usd)));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Lum Network...`, error);
            return null;
        }
    };

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

    getTokenSupply = async (): Promise<number> => {
        try {
            return Number(convertUnit(await this.client.getSupply(LumConstants.MicroLumDenom), LumConstants.LumDenom));
        } catch (error) {
            this._logger.error(`Could not fetch Token Supply for Lum Network...`, error);
            return null;
        }
    };

    getMcap = async (): Promise<number> => {
        try {
            return Promise.all([await this.getTokenSupply(), await this.getPriceLum()]).then(([supply, unit_price_usd]) => Number(supply) * Number(unit_price_usd));
        } catch (error) {
            this._logger.error(`Could not fetch Market Cap for Lum Network...`, error);
            return null;
        }
    };

    getApy = async (): Promise<{ apy: number; symbol: string }> => {
        try {
            const inflation = Number(await this._client.queryClient.mint.inflation()) / CLIENT_PRECISION;
            const metrics = await computeApyMetrics(this.client, Number(await this.getTokenSupply()), inflation, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            return { apy: apy(metrics.inflation, metrics.communityTaxRate, metrics.stakingRatio), symbol: AssetSymbol.LUM };
        } catch (error) {
            this._logger.error(`Could not fetch Apy for Lum Network...`, error);
            return null;
        }
    };

    getTokenInfo = async (): Promise<TokenInfo> => {
        try {
            return await Promise.all([await this.getPriceLum(), await this.getMcap(), await this.getTokenSupply(), (await this.getApy()).apy]).then(
                ([unit_price_usd, total_value_usd, supply, apy]) => ({
                    unit_price_usd,
                    total_value_usd,
                    supply,
                    apy,
                }),
            );
        } catch (error) {
            this._logger.error('Failed to compute Token Info for Lum Network...', error);
            return null;
        }
    };

    getTvl = async (): Promise<{ symbol: string; tvl: number }> => {
        try {
            const decode = LumUtils.Bech32.decode(LUM_STAKING_ADDRESS);
            const getDecodedAddress = LumUtils.Bech32.encode(AssetPrefix.LUM, decode.data);
            const totalToken = await computeTotalAmount(getDecodedAddress, this.client, LumConstants.MicroLumDenom, CLIENT_PRECISION, TEN_EXPONENT_SIX);

            return { tvl: Number(totalToken) * Number(await this.getPriceLum()), symbol: AssetSymbol.LUM };
        } catch (error) {
            this._logger.error('Failed to compute TVL for Lum Network...', error);
            return null;
        }
    };
}
