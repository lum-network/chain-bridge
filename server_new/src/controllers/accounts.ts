import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import Account from "../models/account";
import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";
import Transaction from "../models/transaction";

export const AccountAddressRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    let account = await Account.findOne({
        where: {
            address: req.params.address
        },
        include: [{model: Transaction, as: 'transactions_sent'}, {model:Transaction, as: 'transactions_received'}]
    });

    // In case no account stored locally, we fetch from blockchain and/or response with an empty object
    if(account === null){
        const sbc = new SandblockChainClient();
        const remoteAcc = await sbc.getAccountLive(req.params.address);
        if(remoteAcc === null){
            return response(handler, {},  `No account found with the address ${req.params.address}`, 404);
        }
        account = {
            id: -1,
            address: req.params.address,
            coins: "",
            public_key_type: null,
            public_key_value: null,
            account_number: remoteAcc.result.value.account_number,
            sequence: remoteAcc.result.value.sequence
        }
        return response(handler, account,  "", 200);
    }
    return response(handler, account, "", 200);
}
