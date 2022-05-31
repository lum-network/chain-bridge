import {
    BadRequestException,
    CacheInterceptor,
    Controller,
    Get,
    Logger,
    NotFoundException,
    Param,
    UseInterceptors
} from '@nestjs/common';
import {InjectQueue} from '@nestjs/bull';
import {ConfigService} from "@nestjs/config";
import {MessagePattern, Payload} from '@nestjs/microservices';

import {plainToClass} from 'class-transformer';

import {Queue} from 'bull';

import {LumConstants} from '@lum-network/sdk-javascript';

import {ElasticService, LumService, LumNetworkService} from '@app/services';
import {ElasticIndexes, QueueJobs, Queues} from '@app/utils';
import {LumResponse, StatsResponse} from '@app/http/responses';
import {GatewayWebsocket} from '@app/websocket';

@Controller('')
export class CoreController {
    private readonly _logger: Logger = new Logger(CoreController.name);

    constructor(
        @InjectQueue(Queues.QUEUE_FAUCET) private readonly _queue: Queue,
        private readonly _configService: ConfigService,
        private readonly _elasticService: ElasticService,
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _lumService: LumService,
        private readonly _messageGateway: GatewayWebsocket,
    ) {
    }

    @Get('search/:data')
    @UseInterceptors(CacheInterceptor)
    async search(@Param('data') data: string) {
        // We check the different combinations
        if (/^\d+$/.test(data)) {
            return {type: 'block', data};
        } else if (String(data).startsWith(LumConstants.LumBech32PrefixValAddr)) {
            return {type: 'validator', data};
        } else if (String(data).startsWith(LumConstants.LumBech32PrefixAccAddr)) {
            return {type: 'account', data};
        } else {
            if (await this._elasticService.documentExists(ElasticIndexes.INDEX_BLOCKS, data)) {
                return {type: 'block', data};
            } else if (await this._elasticService.documentExists(ElasticIndexes.INDEX_TRANSACTIONS, data)) {
                return {type: 'transaction', data};
            } else {
                throw new NotFoundException('data_not_found');
            }
        }
    }

    @Get('stats')
    async stats() {
        const lumClt = await this._lumNetworkService.getClient();

        const [inflation, totalSupply, chainId] = await Promise.all([
            lumClt.queryClient.mint.inflation().catch(() => null),
            lumClt.getAllSupplies().catch(() => null),
            lumClt.getChainId().catch(() => null),
        ]);

        return plainToClass(StatsResponse, {inflation: inflation || '0', totalSupply, chainId});
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

    @Get('faucet/:address')
    async faucet(@Param('address') address: string) {
        if (!this._configService.get<string>('FAUCET_MNEMONIC')) {
            throw new BadRequestException('faucet_not_available');
        }

        return this._queue.add(QueueJobs.MINT_FAUCET_REQUEST, {address});
    }

    @MessagePattern('notifySocket')
    async notifySocket(@Payload() data: { channel: string; event: string; data: string }): Promise<void> {
        this._logger.log(`Dispatching notification on channel ${data.channel}...`);
        if (this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(data.channel).emit(data.event, data.data);
        }
    }
}
