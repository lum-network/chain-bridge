import { Command, Console, createSpinner } from 'nestjs-console';
import { ElasticService } from '@app/services';
import { ElasticIndexes } from '@app/utils';

@Console({ command: 'transactions', description: 'Transactions related commands' })
export class TransactionsCommands {
    constructor(private readonly _elasticService: ElasticService) {}

    @Command({ command: 'clear', description: 'Clear the stored transactions dataset' })
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the transactions dataset...');

        await this._elasticService.indexClear(ElasticIndexes.INDEX_TRANSACTIONS);

        spin.succeed('Transactions dataset cleared');
        process.exit(0);
    }
}
