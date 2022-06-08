import {
    BadRequestException,
    Controller,
    Get,
    Logger,
} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {MessagePattern, Payload} from '@nestjs/microservices';

import {plainToClass} from 'class-transformer';

import {LumService, LumNetworkService, BlockService, TransactionService} from '@app/services';
import {LumResponse} from '@app/http/responses';
import {GatewayWebsocket} from '@app/websocket';

@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(
        private readonly _blockService: BlockService,
        private readonly _configService: ConfigService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _lumService: LumService,
        private readonly _messageGateway: GatewayWebsocket,
        private readonly _transactionService: TransactionService
    ) {
    }

    @Get('lum')
    async lum() {
        const [lum, previousDayLum] = await Promise.all([this._lumService.getLum().catch(() => null), this._lumService.getPreviousDayLum().catch(() => null)]);

        if (!lum || !lum.data || !lum.data.length || !previousDayLum || !previousDayLum.data || !previousDayLum.data.length || !previousDayLum.data[previousDayLum.data.length - 24]) {
            throw new BadRequestException('data_not_found');
        }

        const res = {
            ...lum.data[0],
            previous_day_price: previousDayLum.data[previousDayLum.data.length - 24].close,
        };

        return plainToClass(LumResponse, res);
    }



    @MessagePattern('notifySocket')
    async notifySocket(@Payload() data: { channel: string; event: string; data: string }): Promise<void> {
        this._logger.log(`Dispatching notification on channel ${data.channel}...`);
        if (this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(data.channel).emit(data.event, data.data);
        }
    }
}
