import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import Transaction from "../models/transaction";

export const TransactionsIndexRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const transactions = await Transaction.findAll({
        limit: 50,
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });

    return response(handler, transactions, "", 200);
};

export const TransactionHashRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    const transaction = await Transaction.findOne({
        where: {
            hash: req.params.hash.toUpperCase()
        },
        attributes: {
            exclude: ['raw']
        }
    });

    if(transaction === null){
        return response(handler, {},  `No transaction found with the hash ${req.params.hash}`, 404);
    }

    return response(handler, transaction, "", 200);
}
