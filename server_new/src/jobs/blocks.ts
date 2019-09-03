import Block from "../models/block";
import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";
import * as moment from 'moment-timezone';

import * as utils from "sandblock-chain-sdk-js/dist/utils";
import Validator from "../models/validator";
import {SyncTransaction} from "./transactions";
import PusherClient from "../utils/pusher";

const transformBlockProposerAddress = async (proposer_address: string): Promise<string> => {
    const encodedAddress = utils.encodeAddress(proposer_address, 'sandvalcons').toString();//TODO: prefix in config
    const validator = await Validator.findOne({where: {address_consensus: encodedAddress}});
    if(validator !== null){
        return validator.address_operator;
    }
    return proposer_address;
}

export const SyncBlockInternal = async (height: number) => {
    const sbc = new SandblockChainClient();
    let block = await sbc.getBlockAtHeightLive(height);
    if(!block){
        return;
    }

    // Protection for double addition
    if((await Block.findOne({where: {hash: block.block_meta.block_id.hash}})) === null) {
        // Create and save entity
        const entity = new Block({
            chain_id: block.block.header.chain_id,
            hash: block.block_meta.block_id.hash,
            height: block.block.header.height,
            dispatched_at: block.block.header.time,
            num_txs: block.block.header.num_txs,
            total_txs: block.block.header.total_txs,
            proposer_address: await transformBlockProposerAddress(block.block.header.proposer_address),
            raw: JSON.stringify(block)
        });
        entity.save();

        // Dispatch a pusher notif
        await PusherClient.GetInstance(PusherClient).notify('blocks', 'new-block', entity.toJSON());

        // We got transactions to sync also
        if (entity.num_txs > 0) {
            await block.block.data.txs.forEach(async tx => {
                const hash = utils.decodeTransactionHash(tx);
                await SyncTransaction(hash);
            });
        }

        return entity;
    }

    return null;
}

export const SyncBlocks = async () => {
    const sbc = new SandblockChainClient();

    // We first get the last stored block
    const lastBlock = await Block.findOne({order: [['height', 'DESC']], attributes: {exclude: ['raw']}});
    const lastBlockHeight: number = parseInt(lastBlock.height);

    // We get the current height of the blockchain
    const currentStatus = await sbc.getStatus();
    if(!currentStatus.result || !currentStatus.result.sync_info || !currentStatus.result.sync_info.latest_block_height){
        return;
    }
    const currentBlockHeight: number = parseInt(currentStatus.result.sync_info.latest_block_height);

    // If the actual height is the last one, don't do anything
    if(lastBlockHeight == currentBlockHeight){
        return;
    }

    // We cap to max 19 the amount of blocks to proceed on that batch (avoiding race condition)
    let blocksToProceed = currentBlockHeight - lastBlockHeight;
    blocksToProceed = (blocksToProceed > 19) ? 19 : blocksToProceed;

    // We sync each block
    console.log(`Syncing from ${lastBlockHeight + 1} to ${lastBlockHeight + blocksToProceed}`);
    const start = lastBlockHeight + 1;
    const end = start + blocksToProceed;
    const blocks: {result: {block_metas:[{header}]}} = (await sbc.getBlocksBetween(start, end));
    if(!blocks.result){
        return;
    }
    await blocks.result.block_metas.reverse().forEach(async (block)=>{
        await SyncBlockInternal(block.header.height);
        //TODO: Dispatch pusher notification
    });
}
