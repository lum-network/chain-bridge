import {
    BadRequestException,
    Controller,
    Get,
    Logger,
} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {ConfigService} from "@nestjs/config";
import {MessagePattern, Payload} from '@nestjs/microservices';

import {plainToInstance} from 'class-transformer';

import {LumNetworkService, BlockService, TransactionService} from '@app/services';
import {DataResponse, LumResponse} from '@app/http/responses';
import {GatewayWebsocket} from '@app/websocket';

@ApiTags('core')
@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(
        private readonly _blockService: BlockService,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _messageGateway: GatewayWebsocket,
        private readonly _transactionService: TransactionService
    ) {
    }

    @Get('price')
    async price(): Promise<DataResponse> {
        const lumPrice = await this._lumNetworkService.getPrice();
        const lumPreviousPrice = await this._lumNetworkService.getPreviousDayPrice();

        if (!lumPrice || !lumPrice.data || !lumPrice.data.length || !lumPreviousPrice || !lumPreviousPrice.data || !lumPreviousPrice.data.length || !lumPreviousPrice.data[lumPreviousPrice.data.length - 24]) {
            throw new BadRequestException('data_not_found');
        }

        const res = {
            ...lumPrice.data[0],
            previous_day_price: lumPreviousPrice.data[lumPreviousPrice.data.length - 24].close,
        };

        return {
            result: plainToInstance(LumResponse, res)
        };
    }

    @MessagePattern('notifySocket')
    async notifySocket(@Payload() data: { channel: string; event: string; data: string }): Promise<void> {
        this._logger.log(`Dispatching notification on channel ${data.channel}...`);
        if (this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(data.channel).emit(data.event, data.data);
        }
    }
}
