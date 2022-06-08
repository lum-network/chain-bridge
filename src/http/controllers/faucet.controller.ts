import {BadRequestException, Controller, Get, Param} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {InjectQueue} from "@nestjs/bull";
import {ApiTags} from "@nestjs/swagger";

import {Queue} from "bull";

import {QueueJobs, Queues} from "@app/utils";

@ApiTags('faucet')
@Controller('faucet')
export class FaucetController {
    constructor(
        @InjectQueue(Queues.QUEUE_FAUCET) private readonly _queue: Queue,
        private readonly _configService: ConfigService
    ) {
    }

    @Get(':address')
    async faucet(@Param('address') address: string) {
        if (!this._configService.get<string>('FAUCET_MNEMONIC')) {
            throw new BadRequestException('faucet_not_available');
        }

        return this._queue.add(QueueJobs.MINT_FAUCET_REQUEST, {address});
    }
}
