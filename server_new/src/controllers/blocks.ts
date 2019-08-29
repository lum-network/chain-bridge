import {Lifecycle, Request, ResponseToolkit} from "hapi";
import Block from "../models/block";
import {response} from "../utils/http";
import Transaction from "../models/transaction";

export const BlocksIndexRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const blocks = await Block.findAll({
        limit: 50,
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });

    return response(handler, blocks, "", 200);
};

export const BlocksLatestRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const block = await Block.findOne({
        order: [['height', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });

    if(block === null){
        return response(handler, {}, "No latest block found", 404);
    }

    return response(handler, block, "", 200);
};

export const BlockHeightRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const block = await Block.findOne({
        where: {
            height: req.params.height
        },
        attributes: {
            exclude: ['raw']
        },
        include: [Transaction]
    });

    if(!block){
        return response(handler, {}, `No block found with the height ${req.params.height}`, 404);
    }

    return response(handler, block, "", 200);
}
