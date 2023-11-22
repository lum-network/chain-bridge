import { Command, Console } from 'nestjs-console';

import { TransactionService } from '@app/services';

@Console({ command: 'transactions', description: 'Transactions related commands' })
export class TransactionsCommands {
    constructor(private readonly _transactionService: TransactionService) {}

    @Command({ command: 'clear', description: 'Clear the stored transactions dataset' })
    async clear(): Promise<void> {
        await this._transactionService.repository.clear();
        process.exit(0);
    }
}
