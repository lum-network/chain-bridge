import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import Account from "../models/account";

export const AccountAddressRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    const account = await Account.findOne({
        where: {
            address: req.params.address
        }
    });

    if(account === null){
        return response(handler, {},  `No account found with the address ${req.params.address}`, 404);
    }

    return response(handler, account, "", 200);
}
