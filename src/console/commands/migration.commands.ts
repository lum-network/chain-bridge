import {InjectQueue} from "@nestjs/bull";

import {Command, Console} from "nestjs-console";
import {LumTypes} from "@lum-network/sdk-javascript";
import {Queue} from "bull";

import {BlockService, ElasticsearchService, LumNetworkService, ValidatorService} from "@app/services";
import {QueueJobs, Queues} from "@app/utils";


@Console({command: 'migration', description: 'Migration related commands'})
export class MigrationCommands {
    constructor(
        @InjectQueue(Queues.QUEUE_BLOCKS) private readonly _queue: Queue,
        private readonly _blockService: BlockService,
        private readonly _chainService: LumNetworkService,
        private readonly _elasticSearch: ElasticsearchService,
        private readonly _validatorService: ValidatorService
    ) {

    }

    async* scrollSearch(params) {
        let response = await this._elasticSearch.client.search(params);
        while (true) {
            const sourceHits = response.body.hits.hits

            if (sourceHits.length === 0) {
                break
            }

            for (const hit of sourceHits) {
                yield hit
            }

            if (!response.body._scroll_id) {
                break
            }

            response = await this._elasticSearch.client.scroll({
                scroll_id: response.body._scroll_id,
                scroll: params.scroll
            });
        }
    }

    @Command({command: 'blocks', description: 'Migrate blocks from Elasticsearch to Postgres'})
    async migrateBlocks(): Promise<void> {
        const chainId = await this._chainService.client.getChainId();

        console.log('starting');
        const params = {
            index: 'blocks',
            from: 0,
            sort: 'height:asc',
            size: 10000,
            body: {
                query: {
                    match_all: {}
                }
            },
            scroll: '1m'
        }

        for await (const bl of this.scrollSearch(params)) {
            const block = bl._source.raw_block as LumTypes.BlockResponse;
            await this._queue.add(QueueJobs.INGEST, {
                block,
                notify: false,
                ingestTx: false,
                ingestBeam: false
            }, {
                jobId: `${chainId}-block-${block.block.header.height}`,
                attempts: 10,
                backoff: 60000,
            });
            console.log('Sent block', block.block.header.height);
        }
        process.exit(0);
    }
}
