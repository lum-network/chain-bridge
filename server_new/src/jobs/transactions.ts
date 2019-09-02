import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";
import Account from "../models/account";
import Transaction from "../models/transaction";
import Block from "../models/block";

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

const getOrInsertAccount = async (address: string) => {
    if(!address){
        return null;
    }
    address = address.toLowerCase();
    const sbc = new SandblockChainClient();
    let remoteAcc = (await sbc.getAccountLive(address));

    let account = await Account.findOne({where: {address}});
    if(!remoteAcc){
        return;
    }
    remoteAcc = remoteAcc.result;
    if(account === null){
        account = await Account.create({
            address: address,
            coins: JSON.stringify(remoteAcc.value.coins),
            public_key_type: remoteAcc.value.public_key.type,
            public_key_value: remoteAcc.value.publc_key.value,
            account_number: remoteAcc.value.account_number,
            sequence: remoteAcc.value.sequence
        });
    } else {
        if(remoteAcc !== null) {
            account.account_number = remoteAcc.value.account_number;
            account.sequence = remoteAcc.value.sequence;
            account.coins = JSON.stringify(remoteAcc.value.coins);
            account.save();
        }
    }

    return account;
}

export const SyncTransactionInternal = async (tx: any) => {
    // Prevent double addition
    let transaction = await Transaction.findOne({where: {hash: tx.txhash}});
    if(transaction !== null){
        //console.log(`TX with hash ${tx.txhash} already in database, updated`);
        return;
    }

    // Extract interesting values from events
    const action = await extractValueFromEvents(tx.events, "action") || 'unknown';
    const senderAddress = await extractValueFromEvents(tx.events, "sender");
    const recipientAddress = await extractValueFromEvents(tx.events, "recipient");
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

    return transaction;
}

export const SyncTransaction = async (hash: string) => {
    const sbc = new SandblockChainClient();

    const tx = await sbc.getTransactionLive(hash);
    if(tx === null){
        return;
    }
    await SyncTransactionInternal(tx);
    //TODO: dispatch on pusher
}
