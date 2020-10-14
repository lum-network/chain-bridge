import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {BlockchainService, ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";

import * as utils from "sandblock-chain-sdk-js/dist/utils";

const transformBlockProposerAddress = async (proposer_address: string): Promise<string> => {
    const encodedAddress = utils.encodeAddress(proposer_address, 'sandvalcons').toString();//TODO: prefix in config
    const validator = await ElasticService.getInstance().documentGet(ElasticIndexes.INDEX_VALIDATORS, encodedAddress);
    if (validator && validator.body && validator.body.found) {
        return validator.body['_source']['address_operator'];
    }
    return proposer_address;
}

function str_pad(n) {
    return String("00" + n).slice(-2);
}

@Injectable()
export default class BlockScheduler {
    private _logger: Logger = new Logger(BlockScheduler.name);

    @Cron(CronExpression.EVERY_10_SECONDS)
    async ingest() {
        // We get the last block stored in ES
        let lastBlockHeight: number = 0;
        //TODO: implement

        // Get the current status of blockchain
        const currentStatus = await BlockchainService.getInstance().getClient().getStatus();
        if (!currentStatus || !currentStatus.result || !currentStatus.result.sync_info || !currentStatus.result.sync_info.latest_block_height) {
            this._logger.error('Blockchain did not answer to our status call');
            return;
        }
        const currentBlockHeight: number = parseInt(currentStatus.result.sync_info.latest_block_height);

        // If the actual height is the last one, don't do anything
        if (lastBlockHeight == currentBlockHeight) {
            return;
        }

        // We cap to max 19 the amount of blocks to proceed on that batch (avoiding race condition)
        let blocksToProceed = currentBlockHeight - lastBlockHeight;
        blocksToProceed = (blocksToProceed > 19) ? 19 : blocksToProceed;

        // Prepare required boundaries
        this._logger.log(`Syncing from ${lastBlockHeight + 1} to ${lastBlockHeight + blocksToProceed}`);
        const start = lastBlockHeight + 1;
        const end = start + blocksToProceed;

        // Acquire the list of blocks
        const blocks: any = (await BlockchainService.getInstance().getClient().getBlocksBetween(start, end));
        if (!blocks || !blocks.result || !blocks.result.block_metas) {
            this._logger.error(`Unable to get blocks between ${start} and ${end}`);
            return;
        }

        // For each block, proceed with sync
        for (let block of blocks.result.block_metas.reverse()) {
            // If block was already ingested, skip
            if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_BLOCKS, block.block_id.hash))) {
                this._logger.error(`Tried to ingest already present block ${block.block_id.hash}`);
                continue;
            }

            const date = new Date(block.header.time);
            const payload = {
                chain_id: block.header.chain_id,
                hash: block.block_id.hash,
                height: parseInt(block.header.height),
                dispatched_at: `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + (date.getDay() + 1)).slice(-2)}`,
                num_txs: block.num_txs,
                total_txs: (block && block.block && block.block.data && block.block.data.txs) ? block.block.data.txs.length : 0,
                proposer_address: await transformBlockProposerAddress(block.header.proposer_address),
                raw: JSON.stringify(block)
            }

            // Only ingest if transaction isn't yet
            if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_BLOCKS, payload.height)) === false) {
                await ElasticService.getInstance().documentCreate(ElasticIndexes.INDEX_BLOCKS, payload.height, payload);
                this._logger.log(`Block #${payload.height} ingested`);
            }
        }
    }
}
