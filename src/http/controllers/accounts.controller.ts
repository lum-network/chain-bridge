import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes } from '@app/utils/constants';
import { plainToClass } from 'class-transformer';
import { AccountResponse, TransactionResponse } from '@app/http/responses';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';
import { RedelegationResponse } from '@lum-network/sdk-javascript/build/codec/cosmos/staking/v1beta1/staking';

@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export class AccountsController {
    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService) {}

    @Get(':address')
    async show(@Param('address') address: string) {
        const lumClt = await this._lumNetworkService.getClient();

        const txPromise = this._elasticService.documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            sort: { time: 'desc' },
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: address,
                                fields: ['addresses'],
                                type: 'cross_fields',
                                operator: 'OR',
                            },
                        },
                    ],
                },
            },
        });

        const [account, balance, delegations, rewards, withdrawAddress, unbondings, redelegations, commissions, airdrop, transactions] = await Promise.all([
            lumClt.getAccount(address).catch(() => null),
            lumClt.getBalance(address, LumConstants.MicroLumDenom).catch(() => null),
            lumClt.queryClient.staking.delegatorDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.delegationTotalRewards(address).catch(() => null),
            lumClt.queryClient.distribution.delegatorWithdrawAddress(address).catch(() => null),
            lumClt.queryClient.staking.delegatorUnbondingDelegations(address).catch(() => null),
            lumClt.queryClient.staking.redelegations(address, '', '').catch(() => null),
            lumClt.queryClient.distribution.validatorCommission(LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(address).data)).catch(() => null),
            lumClt.queryClient.airdrop.claimRecord(address).catch(() => null),
            txPromise.catch(() => null),
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

        const redelegationsResponse: RedelegationResponse[] = [];

        for (const [, redelegation] of redelegations.redelegationResponses.entries()) {
            redelegationsResponse.push(redelegation);
        }

        // Inject balance
        account['balance'] = !!balance ? balance : null;

        // Inject vesting
        account['vesting'] = vesting;

        // Inject airdrop
        account['airdrop'] = airdrop.claimRecord;

        // Inject delegations
        account['delegations'] = !!delegations ? delegations.delegationResponses : [];

        // Inject rewards
        account['all_rewards'] = !!rewards ? rewards : [];

        // Inject withdraw address
        account['withdraw_address'] = !!withdrawAddress ? withdrawAddress.withdrawAddress : address;

        // Add unbondings
        account['unbondings'] = !!unbondings ? unbondings.unbondingResponses : null;

        // Inject redelegations
        account['redelegations'] = redelegationsResponse;

        // Add commissions
        account['commissions'] = !!commissions && !!commissions.commission ? commissions.commission.commission : null;

        // Inject transactions
        if (transactions && transactions.body && transactions.body.hits && transactions.body.hits.hits) {
            account['transactions'] = transactions.body.hits.hits.map((hit) => plainToClass(TransactionResponse, hit._source));
        } else {
            account['transactions'] = [];
        }

        return plainToClass(AccountResponse, account);
    }
}
