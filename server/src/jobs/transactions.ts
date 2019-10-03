import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";
import * as utils from "sandblock-chain-sdk-js/dist/utils";
import Account from "../models/account";
import Transaction from "../models/transaction";
import Block from "../models/block";
import PusherClient from "../utils/pusher";

const extractValueFromEvents = async (events: [{type, attributes:[{key, value}]}], key: string) => {
    let retn = null;
    await events.forEach(async ev => {
        await ev.attributes.forEach(attr => {
            if(attr.key == key){
                 retn = attr.value;
                 return;
            }
        })
    });
    return retn;
}

const extractValueFromMsg = async (msgs: [{type, value: {}}], key: string) => {
    let retn = null;
    await msgs.forEach(async msg => {
        await Object.keys(msg.value).forEach(v => {
            if(v == key){
                retn = msg.value[v];
                return;
            }
        })
    });
    return retn;
}

export const getOrInsertAccount = async (address: string) => {
    if(!address){
        return null;
    }
    address = address.toLowerCase();

    // In case of validator address, we convert to normal address
    if (address.startsWith('sandvaloper')){
        address = utils.convertValAddressToAccAddress(address).toString();
    }

    // We fetch the remote account from blockchain
    const sbc = new SandblockChainClient();
    let remoteAcc = (await sbc.getAccountLive(address));
    if(remoteAcc === null){
        return;
    }

    let account = await Account.findOne({
        where: {address},
        include: [{model: Transaction, as: 'transactions_sent'}, {model:Transaction, as: 'transactions_received'}]
    });
    remoteAcc = remoteAcc.result;
    if(account === null){
        account = await Account.create({
            address: address,
            coins: JSON.stringify(remoteAcc.value.coins),
            public_key_type: (remoteAcc.value.public_key) ? remoteAcc.value.public_key.type : null,
            public_key_value: (remoteAcc.value.public_key) ? remoteAcc.value.public_key.value : null,
            account_number: remoteAcc.value.account_number,
            sequence: remoteAcc.value.sequence
        });
    } else {
        if(remoteAcc !== null) {
            account.account_number = remoteAcc.value.account_number;
            account.sequence = remoteAcc.value.sequence;
            account.coins = JSON.stringify(remoteAcc.value.coins);
            account.save();
        } else {
            return null;
        }
    }

    return account;
}

export const SyncTransactionInternal = async (tx: any) => {
    // Prevent double addition
    let transaction = await Transaction.findOne({where: {hash: tx.txhash}});
    if(transaction !== null){
        console.log(`TX with hash ${tx.txhash} already in database`);
        return;
    }

    // Extract interesting values from events
    const action = await extractValueFromEvents(tx.events, "action") || 'unknown';
    let senderAddress = await extractValueFromEvents(tx.events, "sender") || await extractValueFromMsg(tx.tx.value.msg, 'from_address');

    // We try again to get sender with particular types
    if(senderAddress === null){
        if(action === "edit_validator") {
            senderAddress = await extractValueFromMsg(tx.tx.value.msg, "address");
        } else if (action == "delegate" || action === "begin_unbonding"){
            senderAddress = await extractValueFromMsg(tx.tx.value.msg, "delegator_address");
        }
    }
    let recipientAddress = await extractValueFromEvents(tx.events, "recipient") || await extractValueFromMsg(tx.tx.value.msg, 'to_address');

    // We try to get recipient with particular types
    if(recipientAddress === null){
        if(action === "delegate" || action === "begin_unbonding"){
            recipientAddress = await extractValueFromMsg(tx.tx.value.msg, "validator_address");
        }
    }
    const amount = await extractValueFromEvents(tx.events, "amount");

    // Get instances to local DB accounts
    let sender: Account = await getOrInsertAccount(senderAddress);
    let recipient: Account = await getOrInsertAccount(recipientAddress);

    // Get block ID
    const block = await Block.findOne({where: {height: tx.height}});

    // Insert transaction
    transaction = await Transaction.create({
        height: tx.height,
        hash: tx.txhash,
        action,
        amount,
        block_id: block.id,
        code: tx.code || null,
        success: tx.logs[0].success || false,
        log: tx.logs[0].log,
        gas_wanted: tx.gas_wanted,
        gas_used: tx.gas_used,
        from_address: senderAddress,
        to_address: recipientAddress,
        sender_id: (sender) ? sender.id : null,
        recipient_id: (recipient) ? recipient.id : null,
        name: tx.tx.value.memo,
        dispatched_at: tx.timestamp,
        msgs: JSON.stringify(tx.tx.value.msg),
        raw: JSON.stringify(tx)
    });

    // Dispatch a pusher notif
    PusherClient.GetInstance(PusherClient).notify('transactions', 'new-transaction', transaction.toJSON());

    return transaction;
}

export const SyncTransaction = async (hash: string) => {
    const sbc = new SandblockChainClient();

    const tx = await sbc.getTransactionLive(hash);
    if(tx === null){
        return;
    }
    await SyncTransactionInternal(tx);
}
