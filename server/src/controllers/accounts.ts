import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import {getOrInsertAccount} from "../jobs/transactions";

export const AccountAddressRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    const account = await getOrInsertAccount(req.params.address);
    if(account === null){
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
    return response(handler, account, "", 200);
}
