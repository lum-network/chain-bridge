import {CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";

import {LumConstants} from "@lum-network/sdk-javascript";

import {BlockService, TransactionService} from "@app/services";

@ApiTags('search')
@Controller('search')
export class SearchController {

    constructor(private readonly _blockService: BlockService, private readonly _transactionService: TransactionService) {
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
            if (await this._blockService.get(parseInt(data, 10))) {
                return {type: 'block', data};
            } else if (await this._transactionService.get(data)) {
                return {type: 'transaction', data};
            } else {
                throw new NotFoundException('data_not_found');
            }
        }
    }
}
