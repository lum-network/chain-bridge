import {Controller, Get, NotFoundException, Req} from "@nestjs/common";
import {Request} from "express";

import {classToPlain} from "class-transformer";

import {BlockchainService} from "@app/Services";
import {AccountResponse} from "@app/Http/Responses";

@Controller('accounts')
export default class AccountsController {
    @Get(':address')
    async show(@Req() req: Request) {
        // Acquire the account instance
        let account = await BlockchainService.getInstance().getClient().getAccountLive(req.params.address);
        if (!account || !account.result || !account.result.value) {
            throw new NotFoundException('account_not_found');
        }
        account = account.result.value;

        // Inject delegations
        const delegations = await BlockchainService.getInstance().getClient().getDelegatorDelegations(req.params.address);
        account['delegations'] = (delegations !== null) ? delegations.result : [];

        // Inject rewards
        const rewards = await BlockchainService.getInstance().getClient().getAllDelegatorRewards(req.params.address);
        account['all_rewards'] = (rewards !== null) ? rewards.result : [];

        // Inject withdraw address
        const address = await BlockchainService.getInstance().getClient().getDelegatorWithdrawAddress(req.params.address);
        account['withdraw_address'] = (address !== null) ? address.result : req.params.address;

        return account;
        // Disabled until we figure out the proper response type
        //return classToPlain(new AccountResponse(account));
    }
}
