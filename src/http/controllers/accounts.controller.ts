import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes } from '@app/utils/constants';
import { plainToClass } from 'class-transformer';
import { AccountResponse, TransactionResponse } from '@app/http/responses';
import { LumConstants } from '@lum-network/sdk-javascript';

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

        const [account, balance, delegations, rewards, validatorAddress, unbondings, transactions] = await Promise.all([
            lumClt.queryClient.auth.account(address).catch(() => null),
            lumClt.queryClient.bank.balance(address, LumConstants.MicroLumDenom).catch(() => null),
            lumClt.queryClient.staking.delegatorDelegations(address).catch(() => null),
            lumClt.queryClient.distribution.delegationTotalRewards(address).catch(() => null),
            lumClt.queryClient.distribution.delegatorWithdrawAddress(address).catch(() => null),
            lumClt.queryClient.staking.delegatorUnbondingDelegations(address).catch(() => null),
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
        account['withdraw_address'] = !!validatorAddress ? validatorAddress.withdrawAddress : address;

        account['unbondings'] = !!unbondings ? unbondings.unbondingResponses : null;

        // Inject transactions
        if (transactions && transactions.body && transactions.body.hits && transactions.body.hits.hits) {
            account['transactions'] = transactions.body.hits.hits.map(hit => plainToClass(TransactionResponse, hit._source));
        } else {
            account['transactions'] = [];
        }

        return plainToClass(AccountResponse, account);
    }
}
