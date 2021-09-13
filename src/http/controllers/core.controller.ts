import { BadRequestException, CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { ElasticService, LumNetworkService } from '@app/services';
import { ElasticIndexes, QueueJobs, Queues } from '@app/utils/constants';
import { LumConstants } from '@lum-network/sdk-javascript';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { config } from '@app/utils';
import { plainToClass } from 'class-transformer';
import { StatsResponse } from '@app/http/responses';

@Controller('')
export class CoreController {
    constructor(private readonly _elasticService: ElasticService, @InjectQueue(Queues.QUEUE_FAUCET) private readonly _queue: Queue, private readonly _lumNetworkService: LumNetworkService) {}

    @Get('search/:data')
    @UseInterceptors(CacheInterceptor)
    async search(@Param('data') data: string) {
        // We check the different combinations
        if (/^\d+$/.test(data)) {
            return { type: 'block', data };
        } else if (String(data).startsWith(LumConstants.LumBech32PrefixValAddr)) {
            return { type: 'validator', data };
        } else if (String(data).startsWith(LumConstants.LumBech32PrefixAccAddr)) {
            return { type: 'account', data };
        } else {
            if (await this._elasticService.documentExists(ElasticIndexes.INDEX_BLOCKS, data)) {
                return { type: 'block', data };
            } else if (await this._elasticService.documentExists(ElasticIndexes.INDEX_TRANSACTIONS, data)) {
                return { type: 'transaction', data };
            } else {
                throw new NotFoundException('data_not_found');
            }
        }
    }

    @Get('stats')
    async stats() {
        const lumClt = await this._lumNetworkService.getClient();

        const [inflation] = await Promise.all([lumClt.queryClient.mint.inflation().catch(() => null)]);

        return plainToClass(StatsResponse, { inflation });
    }

    @Get('faucet/:address')
    async faucet(@Param('address') address: string) {
        if (!config.getFaucetMnemonic()) {
            throw new BadRequestException('faucet_not_available');
        }
        return this._queue.add(QueueJobs.MINT_FAUCET_REQUEST, { address });
    }
}
