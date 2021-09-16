import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes } from '@app/utils/constants';
import { plainToClass } from 'class-transformer';
import { AccountResponse, TransactionResponse } from '@app/http/responses';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';

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

        const [account, balance, delegations, rewards, withdrawAddress, unbondings, commissions, transactions] = await Promise.all([
            lumClt.getAccount(address).catch(() => null),
            lumClt.getBalance(address, LumConstants.MicroLumDenom).catch(() => null),
            lumClt.queryClient.staking.delegatorDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.delegationTotalRewards(address).catch(() => null),
            lumClt.queryClient.distribution.delegatorWithdrawAddress(address).catch(() => null),
            lumClt.queryClient.staking.delegatorUnbondingDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.validatorCommission(LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(address).data)).catch(() => null),
            txPromise.catch(() => null),
        ]);

        console.log('--1-->', account);
        if (!account) {
            throw new NotFoundException('account_not_found');
        }

        console.log('--2-->');

        // Inject balance
        account['balance'] = !!balance ? balance : null;

        console.log('--3-->');

        // Inject delegations
        account['delegations'] = !!delegations ? delegations.delegationResponses : [];

        // Inject rewards
        account['all_rewards'] = !!rewards ? rewards : [];

        // Inject withdraw address
        account['withdraw_address'] = !!withdrawAddress ? withdrawAddress.withdrawAddress : address;

        // Add unbondings
        account['unbondings'] = !!unbondings ? unbondings.unbondingResponses : null;

        console.log('--4-->');
        // Add commissions
        account['commissions'] = !!commissions && !!commissions.commission ? commissions.commission.commission : null;
        console.log('--5-->');
        // Inject transactions
        if (transactions && transactions.body && transactions.body.hits && transactions.body.hits.hits) {
            account['transactions'] = transactions.body.hits.hits.map(hit => plainToClass(TransactionResponse, hit._source));
        } else {
            account['transactions'] = [];
        }

        return plainToClass(AccountResponse, account);
    }
}
