import { Command, Console } from 'nestjs-console';

import { ValidatorService } from '@app/services';

@Console({ command: 'validators', description: 'Validators related commands' })
export class ValidatorsCommands {
    constructor(private readonly _validatorService: ValidatorService) {}

    @Command({ command: 'clear', description: 'Clear the stored validators dataset' })
    async clear(): Promise<void> {
        await this._validatorService.repository.clear();
        process.exit(0);
    }
}
