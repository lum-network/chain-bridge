import {
    BadRequestException,
    Controller,
    Get,
    Logger,
} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";
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

    @ApiOkResponse({status: 200, type: LumResponse})
    @Get('price')
    async price(): Promise<DataResponse> {
        const lumPrice = await this._lumNetworkService.getPrice();

        if (!lumPrice || !lumPrice.data || !lumPrice.data) {
            throw new BadRequestException('data_not_found');
        }

        // Compute the previous price
        const price = lumPrice.data.market_data.current_price.usd;
        let previousPrice = 0.0;
        const priceChange = String(lumPrice.data.market_data.price_change_24h);
        if(priceChange[0] === '-'){
            previousPrice = price + parseFloat(priceChange.split('-')[1]);
        } else {
            previousPrice = price - parseFloat(priceChange);
        }

        const res = {
            price: price,
            denom: lumPrice.data.platforms.cosmos,
            symbol: lumPrice.data.symbol.toUpperCase(),
            liquidity: 0.0,
            volume_24h: lumPrice.data.market_data.total_volume.usd,
            name: lumPrice.data.name,
            previous_day_price: previousPrice
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
