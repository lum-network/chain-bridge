import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import {getOrInsertAccount} from "../jobs/transactions";
import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";

export const AccountAddressRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    const account = await getOrInsertAccount(req.params.address);
    if(account === null || account === undefined){
        return response(handler, {
            id: -1,
            address: req.params.address,
            coins: '',
            public_key_type: null,
            public_key_value: null,
            account_number: 0,
            sequence: 0
        }, "", 200);
    }

    const sbc = new SandblockChainClient();
    let retn = account.toJSON();

    // Inject delegations
    const delegations = await sbc.getDelegatorDelegations(req.params.address);
    retn['delegations'] = (delegations !== null) ? delegations.result : [];

    // Inject rewards
    const rewards = await sbc.getAllDelegatorRewards(req.params.address);
    retn['all_rewards'] = (rewards !== null) ? rewards.result : [];

    // Inject withdraw address
    const address = await sbc.getDelegatorWithdrawAddress(req.params.address);
    retn['withdraw_address'] = (address !== null) ? address.result : req.params.address;

    return response(handler, retn, "", 200);
}
