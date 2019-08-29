"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("sandblock-chain-sdk-js/dist/client");
const account_1 = require("../models/account");
const transaction_1 = require("../models/transaction");
const block_1 = require("../models/block");
const extractValueFromEvents = (events, key) => __awaiter(this, void 0, void 0, function* () {
    let retn = null;
    yield events.forEach((ev) => __awaiter(this, void 0, void 0, function* () {
        yield ev.attributes.forEach(attr => {
            if (attr.key == key) {
                retn = attr.value;
                return;
            }
        });
    }));
    return retn;
});
const getOrInsertAccount = (address) => __awaiter(this, void 0, void 0, function* () {
    if (!address) {
        return null;
    }
    address = address.toLowerCase();
    const sbc = new client_1.default();
    const remoteAcc = (yield sbc.getAccountLive(address));
    let account = yield account_1.default.findOne({ where: { address } });
    if (account === null) {
        account = yield account_1.default.create({
            address: address,
            coins: JSON.stringify(remoteAcc.value.coins),
            public_key_type: remoteAcc.value.public_key.type,
            public_key_value: remoteAcc.value.publc_key.value,
            account_number: remoteAcc.value.account_number,
            sequence: remoteAcc.value.sequence
        });
    }
    else {
        if (remoteAcc !== null) {
            account.account_number = remoteAcc.value.account_number;
            account.sequence = remoteAcc.value.sequence;
            account.coins = JSON.stringify(remoteAcc.value.coins);
            account.save();
        }
    }
    return account;
});
exports.SyncTransactionInternal = (tx) => __awaiter(this, void 0, void 0, function* () {
    // Prevent double addition
    let transaction = yield transaction_1.default.findOne({ where: { hash: tx.txhash } });
    if (transaction !== null) {
        //console.log(`TX with hash ${tx.txhash} already in database, updated`);
        return;
    }
    // Extract interesting values from events
    const action = (yield extractValueFromEvents(tx.events, "action")) || 'unknown';
    const senderAddress = yield extractValueFromEvents(tx.events, "sender");
    const recipientAddress = yield extractValueFromEvents(tx.events, "recipient");
    const amount = yield extractValueFromEvents(tx.events, "amount");
    // Get instances to local DB accounts
    let sender = yield getOrInsertAccount(senderAddress);
    let recipient = yield getOrInsertAccount(recipientAddress);
    // Get block ID
    const block = yield block_1.default.findOne({ where: { height: tx.height } });
    // Insert transaction
    transaction = yield transaction_1.default.create({
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
});
exports.SyncTransaction = (hash) => __awaiter(this, void 0, void 0, function* () {
    const sbc = new client_1.default();
    const tx = yield sbc.getTransactionLive(hash);
    if (tx === null) {
        return;
    }
    yield exports.SyncTransactionInternal(tx);
    //TODO: dispatch on pusher
});
//# sourceMappingURL=transactions.js.map