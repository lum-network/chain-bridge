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
const block_1 = require("../models/block");
const client_1 = require("sandblock-chain-sdk-js/dist/client");
const utils = require("sandblock-chain-sdk-js/dist/utils");
const validator_1 = require("../models/validator");
const transactions_1 = require("./transactions");
const transformBlockProposerAddress = (proposer_address) => __awaiter(this, void 0, void 0, function* () {
    const encodedAddress = utils.encodeAddress(proposer_address, 'sandvalcons').toString(); //TODO: prefix in config
    const validator = yield validator_1.default.findOne({ where: { address_consensus: encodedAddress } });
    if (validator !== null) {
        return validator.address_operator;
    }
    return proposer_address;
});
exports.SyncBlockInternal = (height) => __awaiter(this, void 0, void 0, function* () {
    const sbc = new client_1.default();
    let block = yield sbc.getBlockAtHeightLive(height);
    if (!block) {
        return;
    }
    // Protection for double addition
    if ((yield block_1.default.findOne({ where: { hash: block.block_meta.block_id.hash } })) === null) {
        // Create and save entity
        const entity = new block_1.default({
            chain_id: block.block.header.chain_id,
            hash: block.block_meta.block_id.hash,
            height: block.block.header.height,
            dispatched_at: block.block.header.time,
            num_txs: block.block.header.num_txs,
            total_txs: block.block.header.total_txs,
            proposer_address: yield transformBlockProposerAddress(block.block.header.proposer_address),
            raw: JSON.stringify(block)
        });
        entity.save();
        // We got transactions to sync also
        if (entity.num_txs > 0) {
            yield block.block.data.txs.forEach((tx) => __awaiter(this, void 0, void 0, function* () {
                const hash = utils.decodeTransactionHash(tx);
                yield transactions_1.SyncTransaction(hash);
            }));
        }
        return entity;
    }
    return null;
});
exports.SyncBlocks = () => __awaiter(this, void 0, void 0, function* () {
    const sbc = new client_1.default();
    // We first get the last stored block
    const lastBlock = yield block_1.default.findOne({ order: [['height', 'DESC']], attributes: { exclude: ['raw'] } });
    const lastBlockHeight = parseInt(lastBlock.height);
    // We get the current height of the blockchain
    const currentStatus = yield sbc.getStatus();
    if (!currentStatus.result || !currentStatus.result.sync_info || !currentStatus.result.sync_info.latest_block_height) {
        return;
    }
    const currentBlockHeight = parseInt(currentStatus.result.sync_info.latest_block_height);
    // If the actual height is the last one, don't do anything
    if (lastBlockHeight == currentBlockHeight) {
        return;
    }
    // We cap to max 19 the amount of blocks to proceed on that batch (avoiding race condition)
    let blocksToProceed = currentBlockHeight - lastBlockHeight;
    blocksToProceed = (blocksToProceed > 19) ? 19 : blocksToProceed;
    // We sync each block
    console.log(`Syncing from ${lastBlockHeight + 1} to ${lastBlockHeight + blocksToProceed}`);
    const start = lastBlockHeight + 1;
    const end = start + blocksToProceed;
    const blocks = (yield sbc.getBlocksBetween(start, end));
    if (!blocks.result) {
        return;
    }
    yield blocks.result.block_metas.reverse().forEach((block) => __awaiter(this, void 0, void 0, function* () {
        yield exports.SyncBlockInternal(block.header.height);
        //TODO: Dispatch pusher notification
    }));
});
//# sourceMappingURL=blocks.js.map