import { Command, Console, createSpinner } from 'nestjs-console';
import { ElasticService } from '@app/services';
import { ElasticIndexes } from '@app/utils';

@Console({ command: 'validators', description: 'Validators related commands' })
export class ValidatorsCommands {
    constructor(private readonly _elasticService: ElasticService) {}

    @Command({ command: 'clear', description: 'Clear the stored validators dataset' })
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the validators dataset...');

        await this._elasticService.indexClear(ElasticIndexes.INDEX_VALIDATORS);

        spin.succeed('Validators dataset cleared');
        process.exit(0);
    }
}
