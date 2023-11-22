import { Command, Console } from 'nestjs-console';
import { BlockService } from '@app/services';

@Console({ command: 'blocks', description: 'Blocks related commands' })
export class BlocksCommands {
    constructor(private readonly _blockService: BlockService) {}

    @Command({ command: 'clear', description: 'Clear the stored blocks dataset' })
    async clear(): Promise<void> {
        await this._blockService.repository.clear();
        process.exit(0);
    }
}
