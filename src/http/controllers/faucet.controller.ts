import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Queue } from 'bull';

import { QueueJobs, Queues } from '@app/utils';

@ApiTags('faucet')
@Controller('faucet')
export class FaucetController {
    constructor(@InjectQueue(Queues.FAUCET) private readonly _queue: Queue, private readonly _configService: ConfigService) {}

    @ApiOkResponse({ status: 200, description: 'Request received, processing is intended in background' })
    @Get(':address')
    async faucet(@Param('address') address: string): Promise<void> {
        if (!this._configService.get<string>('FAUCET_MNEMONIC')) {
            throw new BadRequestException('faucet_not_available');
        }

        await this._queue.add(QueueJobs.MINT_FAUCET_REQUEST, { address });
    }
}
