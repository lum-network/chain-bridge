import { Command, Console, createSpinner } from 'nestjs-console';
import { ElasticService } from '@app/services';
import { ElasticIndexes } from '@app/utils';

@Console({ command: 'blocks', description: 'Blocks related commands' })
export class BlocksCommands {
    constructor(private readonly _elasticService: ElasticService) {}

    @Command({ command: 'clear', description: 'Clear the stored blocks dataset' })
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the blocks dataset...');

        await this._elasticService.indexClear(ElasticIndexes.INDEX_BLOCKS);

        spin.succeed('Blocks dataset cleared');
        process.exit(0);
    }
}
