import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {hex2bin, response} from "../utils/http";
import Migration from "../models/migration";

import * as Web3 from 'web3';
import * as etherscan from 'etherscan-api';

export const MigrationShowRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    const migration = await Migration.findOne({
        where: {
            reference: req.params.reference
        }
    });

    if(migration === null){
        return response(handler, {},  `No migration found with the address ${req.params.reference}`, 404);
    }

    return response(handler, migration, "", 200);
}

export const MigrationStoreRoute: Lifecycle.Method = async(req: Request, handler: ResponseToolkit) => {
    //@ts-ignore
    const address = req.payload.address;
    //@ts-ignore
    const msg = req.payload.msg;
    //@ts-ignore
    const sig = req.payload.sig;
    //@ts-ignore
    const version = req.payload.version;

    // Check if signer is the original sender
    const web3 = new Web3(Web3.givenProvider);
    const signer = web3.eth.accounts.recover(msg, sig);
    if(signer.toUpperCase() != address.toUpperCase()){
        return response(handler, {}, "We weren't able to verify your message. Please try again", 403);
    }

    // Check for already present request
    if((await Migration.findOne({where: {from_address: signer, state: 'WAITING'}})) !== null){
        return response(handler, {}, "That account already have a pending migration request", 403);
    }

    // Check the SAT balance
    const api = etherscan.init(process.env.ETHERSCAN_API_KEY);
    let balance = await api.account.tokenbalance(address, '', '0x92736b3bff1bbd72a72478d78f18a6ab9b68b791');
    if(balance.message !== 'OK'){
        return response(handler, {}, "Unable to fetch your SAT balance", 500);
    }
    if(parseInt(balance.result) <= 0) {
        return response(handler, {}, "You don't have any SAT to migrate", 400);
    }
    balance = web3.utils.fromWei(balance.result, 'ether');

    // Decode the msg
    const decodedMsg = JSON.parse(hex2bin(msg));

    // Insert the migration request
    const migration = new Migration({
        'reference': Math.random().toString(36).slice(-10),
        'state': 'WAITING',
        'from_address': signer,
        'to_address': decodedMsg.destination,
        'amount': balance
    });
    await migration.save();

    return response(handler, migration, "Migration request received!", 200);
}
