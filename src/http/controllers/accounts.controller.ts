import { Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import {estimatedVesting, fromBech32, LumBech32Prefixes, toBech32} from '@lum-network/sdk-javascript';

import { plainToInstance } from 'class-transformer';

import { ChainService, TransactionService, ValidatorDelegationService } from '@app/services';
import { AccountResponse, DataResponse, DataResponseMetadata, DelegationResponse, RedelegationResponse, TransactionResponse, UnbondingResponse } from '@app/http/responses';
import { DefaultTake } from '@app/http/decorators';
import { AssetSymbol, ExplorerRequest } from '@app/utils';

@ApiTags('accounts')
@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export class AccountsController {
    constructor(
        private readonly _chainService: ChainService,
        private readonly _transactionService: TransactionService,
        private readonly _validatorDelegationService: ValidatorDelegationService,
    ) {}

    @ApiOkResponse({ status: 200, type: [DelegationResponse] })
    @DefaultTake(25)
    @Get(':address/delegations')
    async showDelegations(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [delegations, total] = await this._validatorDelegationService.fetchByDelegatorAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: delegations.map((delegation) => plainToInstance(DelegationResponse, delegation)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: delegations.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: [TransactionResponse] })
    @DefaultTake(50)
    @Get(':address/transactions')
    async showTransactions(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [transactions, total] = await this._transactionService.fetchForAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: transactions.map((tx) => plainToInstance(TransactionResponse, tx)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: transactions.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: [RedelegationResponse] })
    @Get(':address/redelegations')
    async showRedelegations(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const redelegations = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.staking.v1beta1.redelegations({ delegatorAddr: address, dstValidatorAddr: '', srcValidatorAddr: '' });
        return new DataResponse({
            result: redelegations.redelegationResponses.map((redelegation) => plainToInstance(RedelegationResponse, redelegation)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: redelegations.redelegationResponses.length,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: [UnbondingResponse] })
    @Get(':address/unbondings')
    async showUnbondings(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const unbondings = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.staking.v1beta1.delegatorUnbondingDelegations({ delegatorAddr: address });
        return new DataResponse({
            result: unbondings.unbondingResponses.map((unbonding) => plainToInstance(UnbondingResponse, unbonding)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: unbondings.unbondingResponses.length,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: AccountResponse })
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        const [account, balances, rewards, withdrawAddress, commissions, totalShares] = await Promise.all([
            this._chainService
                .getChain(AssetSymbol.LUM)
                .client.cosmos.auth.v1beta1.account({ address })
                .catch(() => null),
            this._chainService
                .getChain(AssetSymbol.LUM)
                .client.cosmos.bank.v1beta1.allBalances({ address })
                .catch(() => null),
            this._chainService
                .getChain(AssetSymbol.LUM)
                .client.cosmos.distribution.v1beta1.delegationTotalRewards({ delegatorAddress: address })
                .catch(() => null),
            this._chainService
                .getChain(AssetSymbol.LUM)
                .client.cosmos.distribution.v1beta1.delegatorWithdrawAddress({ delegatorAddress: address })
                .catch(() => null),
            this._chainService
                .getChain(AssetSymbol.LUM)
                .client.cosmos.distribution.v1beta1.validatorCommission({ validatorAddress: toBech32(LumBech32Prefixes.VAL_ADDR, fromBech32(address).data) })
                .catch(() => null),
            this._validatorDelegationService.sumTotalSharesForDelegator(address).catch(() => null),
        ]);

        if (!account) {
            throw new NotFoundException('account_not_found');
        }

        let vesting: any;

        try {
            vesting = estimatedVesting(account);
        } catch (e) {
            vesting = null;
        }

        return {
            result: plainToInstance(AccountResponse, {
                ...account,
                all_rewards: {
                    total: rewards.total.map((rwd) => {
                        return {
                            denom: rwd.denom,
                            amount: parseInt(rwd.amount, 10),
                        };
                    }),
                    rewards: rewards.rewards.map((rwd) => {
                        return {
                            validator_address: rwd.validatorAddress,
                            reward: rwd.reward.map((rwd2) => {
                                return {
                                    denom: rwd2.denom,
                                    amount: parseInt(rwd2.amount, 10),
                                };
                            }),
                        };
                    }),
                },
                balances: balances.map((balance) => {
                    return {
                        denom: balance.denom,
                        amount: parseInt(balance.amount, 10),
                    };
                }),
                commissions: commissions.commission.commission.map((com) => {
                    return {
                        denom: com.denom,
                        amount: parseInt(com.amount, 10),
                    };
                }),
                vesting: vesting
                    ? {
                          ...vesting,
                          total_coins: vesting.totalCoins
                              ? {
                                    denom: vesting.totalCoins.denom,
                                    amount: parseInt(vesting.totalCoins.amount, 10),
                                }
                              : null,
                          unlocked_coins: vesting.unlockedCoins
                              ? {
                                    denom: vesting.unlockedCoins.denom,
                                    amount: parseInt(vesting.unlockedCoins.amount, 10),
                                }
                              : null,
                          locked_coins: vesting.lockedCoins
                              ? {
                                    denom: vesting.lockedCoins.denom,
                                    amount: parseInt(vesting.lockedCoins.amount, 10),
                                }
                              : null,
                          locked_delegated_coins: vesting.lockedDelegatedCoins
                              ? {
                                    denom: vesting.lockedDelegatedCoins.denom,
                                    amount: parseInt(vesting.lockedDelegatedCoins.amount, 10),
                                }
                              : null,
                          locked_bank_coins: vesting.lockedBankCoins
                              ? {
                                    denom: vesting.lockedBankCoins.denom,
                                    amount: parseInt(vesting.lockedBankCoins.amount, 10),
                                }
                              : null,
                      }
                    : null,
                withdraw_address: !!withdrawAddress ? withdrawAddress.withdrawAddress : address,
                total_shares: totalShares.total_shares,
            }),
        };
    }
}
