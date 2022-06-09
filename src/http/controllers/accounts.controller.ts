import {CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {LumConstants, LumUtils} from '@lum-network/sdk-javascript';
import {RedelegationResponse} from '@lum-network/sdk-javascript/build/codec/cosmos/staking/v1beta1/staking';

import {plainToInstance} from 'class-transformer';

import {LumNetworkService, TransactionService} from '@app/services';
import {AccountResponse, DataResponse, TransactionResponse} from '@app/http/responses';

@ApiTags('accounts')
@Controller('accounts')
@UseInterceptors(CacheInterceptor)
export class AccountsController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _transactionService: TransactionService) {
    }

    @ApiOkResponse({status: 200, type: AccountResponse})
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        const [transactions, totalTransactions] = await this._transactionService.fetchForAddress(address);

        const [account, balance, delegations, rewards, withdrawAddress, unbondings, redelegations, commissions, airdrop] = await Promise.all([
            this._lumNetworkService.client.getAccount(address).catch(() => null),
            this._lumNetworkService.client.getBalance(address, LumConstants.MicroLumDenom).catch(() => null),
            this._lumNetworkService.client.queryClient.staking.delegatorDelegations(address).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.delegationTotalRewards(address).catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.delegatorWithdrawAddress(address).catch(() => null),
            this._lumNetworkService.client.queryClient.staking.delegatorUnbondingDelegations(address).catch(() => null),
            this._lumNetworkService.client.queryClient.staking.redelegations(address, '', '').catch(() => null),
            this._lumNetworkService.client.queryClient.distribution.validatorCommission(LumUtils.Bech32.encode(LumConstants.LumBech32PrefixValAddr, LumUtils.Bech32.decode(address).data)).catch(() => null),
            this._lumNetworkService.client.queryClient.airdrop.claimRecord(address).catch(() => null),
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

        if (redelegations) {
            for (const [, redelegation] of redelegations.redelegationResponses.entries()) {
                redelegationsResponse.push(redelegation);
            }
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
        if (transactions && transactions.length > 0) {
            account['transactions'] = transactions.map((hit) => plainToInstance(TransactionResponse, hit));
        } else {
            account['transactions'] = [];
        }

        return {
            result: plainToInstance(AccountResponse, account)
        };
    }
}
