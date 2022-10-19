import { Command, Console, createSpinner } from 'nestjs-console';
import { BlockService } from '@app/services';

@Console({ command: 'blocks', description: 'Blocks related commands' })
export class BlocksCommands {
    constructor(private readonly _blockService: BlockService) {}

    @Command({ command: 'clear', description: 'Clear the stored blocks dataset' })
    async clear(): Promise<void> {
        const spin = createSpinner();
        spin.start('Clearing the blocks dataset...');

        await this._blockService.repository.clear();

        spin.succeed('Blocks dataset cleared');
        process.exit(0);
    }
}
