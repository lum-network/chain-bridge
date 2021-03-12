import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';

import { ElasticService, LumNetworkService } from '@app/Services';
import { ElasticIndexes } from '@app/Utils/Constants';
import { plainToClass } from 'class-transformer';
import { AccountResponse, TransactionResponse } from '@app/Http/Responses';

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
                                fields: ['from_address', 'to_address'],
                                type: 'cross_fields',
                                operator: 'OR',
                            },
                        },
                    ],
                },
            },
        });

        const [account, delegations, rewards, address, transactions] = await Promise.all([
            lumClt.queryClient.auth.account(req.params.address),
            lumClt.queryClient.staking.unverified.delegatorDelegations(req.params.address),
            lumClt.queryClient.distribution.unverified.delegationTotalRewards(req.params.address),
            lumClt.queryClient.distribution.unverified.delegatorWithdrawAddress(req.params.address),
            txPromise,
        ]);

        if (!account || !account.accountNumber) {
            throw new NotFoundException('account_not_found');
        }

        // Inject delegations
        account['delegations'] = delegations !== null ? delegations.delegationResponses : [];

        // Inject rewards
        account['all_rewards'] = rewards !== null ? rewards : [];

        // Inject withdraw address
        account['withdraw_address'] = address !== null ? address.withdrawAddress : req.params.address;

        // Inject transactions
        if (transactions && transactions.body && transactions.body.hits && transactions.body.hits.hits) {
            account['transactions'] = transactions.body.hits.hits.map((hit) => plainToClass(TransactionResponse, hit._source));
        } else {
            account['transactions'] = [];
        }

        return plainToClass(AccountResponse, account);
    }
}
