import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';

import { ElasticService, LumNetworkService } from '@app/Services';
import { ElasticIndexes } from '@app/Utils/Constants';
import { plainToClass } from 'class-transformer';
import { AccountResponse, TransactionResponse } from '@app/Http/Responses';
import { LumConstants } from '@lum-network/sdk-javascript';

@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export default class AccountsController {
    constructor(private readonly _elasticService: ElasticService, private readonly _lumNetworkService: LumNetworkService) {}

    @Get(':address')
    async show(@Req() req: Request) {
        const lumClt = await this._lumNetworkService.getClient();

        const txPromise = this._elasticService.documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            sort: { time: 'desc' },
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: req.params.address,
                                fields: ['addresses'],
                                type: 'cross_fields',
                                operator: 'OR',
                            },
                        },
                    ],
                },
            },
        });

        const [account, balance, delegations, rewards, address, unbondings, transactions] = await Promise.all([
            lumClt.queryClient.auth.unverified.account(req.params.address).catch(() => null),
            lumClt.queryClient.bank.unverified.balance(req.params.address, LumConstants.LumDenom).catch(() => null),
            lumClt.queryClient.staking.unverified.delegatorDelegations(req.params.address).catch(() => null),
            lumClt.queryClient.distribution.unverified.delegationTotalRewards(req.params.address).catch(() => null),
            lumClt.queryClient.distribution.unverified.delegatorWithdrawAddress(req.params.address).catch(() => null),
            lumClt.queryClient.staking.unverified.delegatorUnbondingDelegations(req.params.address).catch(() => null),
            txPromise.catch(() => null),
        ]);

        if (!account || !account.accountNumber) {
            throw new NotFoundException('account_not_found');
        }

        // Inject balance
        account['balance'] = !!balance ? balance : null;

        // Inject delegations
        account['delegations'] = !!delegations ? delegations.delegationResponses : [];

        // Inject rewards
        account['all_rewards'] = !!rewards ? rewards : [];

        // Inject withdraw address
        account['withdraw_address'] = !!address ? address.withdrawAddress : req.params.address;

        account['unbondings'] = !!unbondings ? unbondings.unbondingResponses : null;

        // Inject transactions
        if (transactions && transactions.body && transactions.body.hits && transactions.body.hits.hits) {
            account['transactions'] = transactions.body.hits.hits.map((hit) => plainToClass(TransactionResponse, hit._source));
        } else {
            account['transactions'] = [];
        }

        return plainToClass(AccountResponse, account);
    }
}
