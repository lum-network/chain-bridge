import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {LumConstants, LumUtils} from '@lum-network/sdk-javascript';

import {plainToInstance} from 'class-transformer';

import {LumNetworkService, TransactionService, ValidatorDelegationService} from '@app/services';
import {
    AccountResponse,
    DataResponse,
    DataResponseMetadata,
    DelegationResponse,
    RedelegationResponse,
    TransactionResponse, UnbondingResponse
} from '@app/http/responses';
import {DefaultTake} from "@app/http/decorators";
import {CLIENT_PRECISION, ExplorerRequest} from "@app/utils";

@ApiTags('accounts')
@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export class AccountsController {
    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _transactionService: TransactionService,
        private readonly _validatorDelegationService: ValidatorDelegationService
    ) {
    }

    @ApiOkResponse({status: 200, type: [DelegationResponse]})
    @DefaultTake(25)
    @Get(':address/delegations')
    async showDelegations(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [delegations, total] = await this._validatorDelegationService.fetchByDelegatorAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: delegations.map(delegation => plainToInstance(DelegationResponse, delegation)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: delegations.length,
                items_total: total,
            })
        })
    }

    @ApiOkResponse({status: 200, type: [TransactionResponse]})
    @DefaultTake(50)
    @Get(':address/transactions')
    async showTransactions(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [transactions, total] = await this._transactionService.fetchForAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: transactions.map(tx => plainToInstance(TransactionResponse, tx)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: transactions.length,
                items_total: total,
            })
        })
    }

    @ApiOkResponse({status: 200, type: [RedelegationResponse]})
    @Get(':address/redelegations')
    async showRedelegations(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const redelegations = await this._lumNetworkService.client.queryClient.staking.redelegations(address, '', '');
        return new DataResponse({
            result: redelegations.redelegationResponses.map(redelegation => plainToInstance(RedelegationResponse, redelegation)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: redelegations.redelegationResponses.length,
                items_total: null,
            })
        })
    }

    @ApiOkResponse({status: 200, type: [UnbondingResponse]})
    @Get(':address/unbondings')
    async showUnbondings(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const unbondings = await this._lumNetworkService.client.queryClient.staking.delegatorUnbondingDelegations(address);
        return new DataResponse({
            result: unbondings.unbondingResponses.map(unbonding => plainToInstance(UnbondingResponse, unbonding)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: unbondings.unbondingResponses.length,
                items_total: null,
            })
        })
    }

    @ApiOkResponse({status: 200, type: AccountResponse})
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        const [account, balance, rewards, withdrawAddress, commissions, airdrop, totalShares] = await Promise.all([
            this._lumNetworkService.client.getAccount(address).catch(() => null),
            this._lumNetworkService.client.getBalance(address, LumConstants.MicroLumDenom).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.delegationTotalRewards(address).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.delegatorWithdrawAddress(address).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.validatorCommission(LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(address).data)).catch(() => null),
            this._lumNetworkService.client.queryClient.airdrop.claimRecord(address).catch(() => null),
            this._validatorDelegationService.sumTotalSharesForDelegator(address).catch(() => null)
        ]);

        if (!account) {
            throw new NotFoundException('account_not_found');
        }

        let vesting: any;

        try {
            vesting = LumUtils.estimatedVesting(account);
        } catch (e) {
            vesting = null;
        }

        return {
            result: plainToInstance(AccountResponse, {
                ...account,
                all_rewards_old: !!rewards ? rewards : [],
                all_rewards: {
                    total: rewards.total.map(rwd => {
                        return {
                            denom: rwd.denom,
                            amount: parseInt(rwd.amount, 10) / CLIENT_PRECISION
                        }
                    }),
                    rewards: rewards.rewards.map(rwd => {
                        return {
                            validator_address: rwd.validatorAddress,
                            reward: rwd.reward.map(rwd2 => {
                                return {
                                    denom: rwd2.denom,
                                    amount: parseInt(rwd2.amount, 10) / CLIENT_PRECISION
                                }
                            })
                        }
                    })
                },
                airdrop: airdrop.claimRecord,
                balance: !!balance ? balance : null,
                commissions: !!commissions && !!commissions.commission ? commissions.commission.commission : null,
                vesting: vesting,
                withdraw_address: !!withdrawAddress ? withdrawAddress.withdrawAddress : address,
                total_shares: totalShares.total_shares
            })
        };
    }
}
