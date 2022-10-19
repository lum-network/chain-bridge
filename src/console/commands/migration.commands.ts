import {Command, Console} from "nestjs-console";
import {LumTypes} from "@lum-network/sdk-javascript";
import fs from 'fs';

import {BlockService, ElasticsearchService, LumNetworkService, ValidatorService} from "@app/services";


@Console({command: 'migration', description: 'Migration related commands'})
export class MigrationCommands {
    constructor(
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
        const writer = fs.createWriteStream('blocks.txt', {
            flags: 'a'
        });

        let start = 810000;

        const params = {
            index: 'blocks',
            from: 0,
            sort: 'height:asc',
            size: 10000,
            body: {
                query: {
                    range: {
                        height: {
                            gte: start,
                            lte: 2000000
                        }
                    }
                }
            },
            scroll: '2m'
        }

        let counter = start;
        for await (const bl of this.scrollSearch(params)) {
            const block = bl._source.raw_block as LumTypes.BlockResponse;
            counter++;
            writer.write(JSON.stringify(block) + '\n');
            console.log(`Wrote ${counter} blocks`);
        }
        writer.close();
        process.exit(0);
    }
}
