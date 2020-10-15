import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {BlockchainService, ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";

import * as utils from "sandblock-chain-sdk-js/dist/utils";
import moment from 'moment';

const transformBlockProposerAddress = async (proposer_address: string): Promise<string> => {
    const encodedAddress = utils.encodeAddress(proposer_address, 'sandvalcons').toString();//TODO: prefix in config
    const validator = await ElasticService.getInstance().documentGet(ElasticIndexes.INDEX_VALIDATORS, encodedAddress);
    if (validator && validator.body && validator.body.found) {
        return validator.body['_source']['address_operator'];
    }
    return proposer_address;
}

@Injectable()
export default class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    @Cron(CronExpression.EVERY_10_SECONDS)
    async SyncBlocks() {
        // We get the last block stored in ES
        const lastBlock = await ElasticService.getInstance().documentSearch(ElasticIndexes.INDEX_BLOCKS, {
            size: 1,
            sort: {"dispatched_at": "desc"},
            query: {
                match_all: {}
            }
        });
        // Ensure we have all the required data
        if (!lastBlock || !lastBlock.body || !lastBlock.body.hits || !lastBlock.body.hits.hits || lastBlock.body.hits.hits.length !== 1) {
            this._logger.error(`Failed to acquire the last blocked stored in ES`);
            return;
        }
        let lastBlockHeight: number = lastBlock.body.hits.hits[0]['_source']['height'];

        // Get the current status of blockchain
        const currentStatus = await BlockchainService.getInstance().getClient().getStatus();
        if (!currentStatus || !currentStatus.result || !currentStatus.result.sync_info || !currentStatus.result.sync_info.latest_block_height) {
            this._logger.error('Blockchain did not answer to our status call');
            return;
        }
        const currentBlockHeight: number = parseInt(currentStatus.result.sync_info.latest_block_height);

        // If the actual height is the last one, don't do anything (avoiding race condition)
        if (lastBlockHeight == currentBlockHeight) {
            return;
        }

        // We cap to max 19 the amount of blocks to proceed on that batch (avoiding race condition)
        let blocksToProceed = currentBlockHeight - lastBlockHeight;
        blocksToProceed = (blocksToProceed > 19) ? 19 : blocksToProceed;

        // Prepare required boundaries
        this._logger.log(`Syncing from ${lastBlockHeight + 1} to ${lastBlockHeight + blocksToProceed}`);
        const start = 90;//lastBlockHeight + 1;
        const end = 100;//start + blocksToProceed;

        // Acquire the list of blocks
        const blocks: any = (await BlockchainService.getInstance().getClient().getBlocksBetween(start, end));
        if (!blocks || !blocks.result || !blocks.result.block_metas) {
            this._logger.error(`Unable to get blocks between ${start} and ${end}`);
            return;
        }

        // For each block, proceed with sync
        for (let bl of blocks.result.block_metas.reverse()) {
            const block = await BlockchainService.getInstance().getClient().getBlockAtHeightLive(bl.header.height);
            if(!block){
                this._logger.error(`Failed to acquire block at height ${bl.header.height}`);
                continue;
            }

            const payload = {
                chain_id: block.block.header.chain_id,
                hash: block.block_id.hash,
                height: parseInt(block.block.header.height),
                dispatched_at: moment(block.block.header.time).format('yyyy-MM-DD HH:mm:ss'),
                num_txs: bl.num_txs,
                total_txs: (block && block.block && block.block.data && block.block.data.txs) ? block.block.data.txs.length : 0,
                proposer_address: await transformBlockProposerAddress(block.block.header.proposer_address),
                raw: JSON.stringify(block),
                transactions: []
            }

            // If we have transaction, we append to the payload the decoded txHash to allow further search of it
            if (payload.total_txs > 0){
                for (let tx of block.block.data.txs){
                    const txHash = utils.decodeTransactionHash(tx);
                    payload.transactions.push(txHash);
                }
            }

            // Ingest or update (allow to relaunch the ingest from scratch to ensure we store the correct data)
            if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_BLOCKS, payload.height)) === false) {
                await ElasticService.getInstance().documentCreate(ElasticIndexes.INDEX_BLOCKS, payload.height, payload);
                this._logger.log(`Block #${payload.height} ingested`);
            } else {
                await ElasticService.getInstance().documentUpdate(ElasticIndexes.INDEX_BLOCKS, payload.height, payload);
                this._logger.log(`Block #${payload.height} updated`);
            }
        }
    }
}
