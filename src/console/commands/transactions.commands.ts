import {Command, Console, createSpinner} from 'nestjs-console';

import {TransactionService} from "@app/services";

@Console({command: 'transactions', description: 'Transactions related commands'})
export class TransactionsCommands {
    constructor(private readonly _transactionService: TransactionService) {
    }

    @Command({command: 'clear', description: 'Clear the stored transactions dataset'})
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the transactions dataset...');

        // TODO: clear

        spin.succeed('Transactions dataset cleared');
        process.exit(0);
    }
}
