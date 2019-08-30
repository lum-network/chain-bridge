import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import Block from "../models/block";
import Transaction from "../models/transaction";

export const SearchRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    //@ts-ignore
    const data = req.payload.data;

    // We check the different combinations
    if(/^\d+$/.test(data)){
        return response(handler, {type: 'block', data}, "", 200);
    } else if (String(data).startsWith('sand')){
        return response(handler, {type: 'account', data}, "", 200);
    } else {
        const block = await Block.findOne({where: {hash: data}});
        const transaction = await Transaction.findOne({where: {hash: data}});
        if(block !== null){
            return response(handler, {type: 'block', data: block.height}, "", 200);
        } else if (transaction !== null){
            return response(handler, {type: 'transaction', data: transaction.hash}, "", 200);
        } else {
            return response(handler, {}, "Unable to find any associated data", 404);
        }
    }

}
