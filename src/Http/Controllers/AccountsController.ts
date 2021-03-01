import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';

import { BlockchainService, ElasticService } from '@app/Services';
import { ElasticIndexes } from '@app/Utils/Constants';
import { classToPlain } from 'class-transformer';
import { TransactionResponse } from '@app/Http/Responses';

@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export default class AccountsController {
    constructor(private readonly _elasticService: ElasticService) {}

    @Get(':address')
    async show(@Req() req: Request) {
        // Acquire the account instance
        let account = await BlockchainService.getInstance()
            .getClient()
            .getAccountLive(req.params.address);
        if (!account || !account.result || !account.result.value) {
            throw new NotFoundException('account_not_found');
        }
        account = account.result.value;

        // Inject delegations
        const delegations = await BlockchainService.getInstance()
            .getClient()
            .getDelegatorDelegations(req.params.address);
        account['delegations'] = delegations !== null ? delegations.result : [];

        // Inject rewards
        const rewards = await BlockchainService.getInstance()
            .getClient()
            .getAllDelegatorRewards(req.params.address);
        account['all_rewards'] = rewards !== null ? rewards.result : [];

        // Inject withdraw address
        const address = await BlockchainService.getInstance()
            .getClient()
            .getDelegatorWithdrawAddress(req.params.address);
        account['withdraw_address'] = address !== null ? address.result : req.params.address;

        // Inject transactions
        const result = await this._elasticService.documentSearch(ElasticIndexes.INDEX_TRANSACTIONS, {
            sort: { dispatched_at: 'desc' },
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: account.address,
                                fields: ['from_address', 'to_address'],
                                type: 'cross_fields',
                                operator: 'OR',
                            },
                        },
                    ],
                },
            },
        });
        if (result && result.body && result.body.hits && result.body.hits.hits) {
            account['transactions'] = result.body.hits.hits.map(hit => classToPlain(new TransactionResponse(hit._source)));
        } else {
            account['transactions'] = [];
        }

        return account;
        // Disabled until we figure out the proper response type
        //return classToPlain(new AccountResponse(account));
    }
}
