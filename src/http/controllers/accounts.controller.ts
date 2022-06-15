import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {LumConstants, LumUtils} from '@lum-network/sdk-javascript';
import {RedelegationResponse} from '@lum-network/sdk-javascript/build/codec/cosmos/staking/v1beta1/staking';

import {plainToInstance} from 'class-transformer';

import {LumNetworkService, TransactionService, ValidatorDelegationService} from '@app/services';
import {
    AccountResponse,
    DataResponse,
    DataResponseMetadata,
    DelegationResponse,
    TransactionResponse
} from '@app/http/responses';
import {DefaultTake} from "@app/http/decorators";
import {ExplorerRequest} from "@app/utils";

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
            result: delegations.map(del => plainToInstance(DelegationResponse, del)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: delegations.length,
                items_total: total,
            })
        })
    }

    @ApiOkResponse({status: 200, type: AccountResponse})
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [transactions, totalTransactions] = await this._transactionService.fetchForAddress(address);

        const [account, balance, rewards, withdrawAddress, unbondings, redelegations, commissions, airdrop] = await Promise.all([
            this._lumNetworkService.client.getAccount(address).catch(() => null),
            this._lumNetworkService.client.getBalance(address, LumConstants.MicroLumDenom).catch(() => null),
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
