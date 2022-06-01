import { Command, Console, createSpinner } from 'nestjs-console';

import { ElasticIndexes } from '@app/utils';
import {ValidatorService} from "@app/services";

@Console({ command: 'validators', description: 'Validators related commands' })
export class ValidatorsCommands {
    constructor(private readonly _validatorService: ValidatorService) {}

    @Command({ command: 'clear', description: 'Clear the stored validators dataset' })
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the validators dataset...');

        // TODO: clear

        spin.succeed('Validators dataset cleared');
        process.exit(0);
    }
}
