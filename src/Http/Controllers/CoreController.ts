import { CacheInterceptor, Controller, Get, NotFoundException, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ElasticService } from '@app/Services';
import { ElasticIndexes } from '@app/Utils/Constants';
import { LumConstants } from '@lum-network/sdk-javascript';

@Controller('')
export default class CoreController {
    constructor(private readonly _elasticService: ElasticService) {}

    @Get('search/:data')
    @UseInterceptors(CacheInterceptor)
    async search(@Req() req: Request) {
        const data = req.params.data;

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
}
