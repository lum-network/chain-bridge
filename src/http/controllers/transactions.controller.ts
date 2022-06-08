import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToClass} from 'class-transformer';

import {TransactionService} from '@app/services';
import {DataResponse, DataResponseMetadata, TransactionResponse} from '@app/http/responses';
import {ExplorerRequest} from "@app/utils";

@ApiTags('transactions')
@Controller('transactions')
@UseInterceptors(CacheInterceptor)
export class TransactionsController {
    constructor(private readonly _transactionService: TransactionService) {
    }

    @ApiOkResponse({status: 200, type: DataResponse})
    @Get('')
    async fetch(@Req() request: ExplorerRequest) {
        const [transactions, total] = await this._transactionService.fetch(request.pagination.skip, request.pagination.limit);
        if (!transactions) {
            throw new NotFoundException('transactions_not_found');
        }

        return plainToClass(DataResponse, {
            result: transactions.map((tx) => plainToClass(TransactionResponse, tx)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: transactions.length,
                items_total: total,
            })
        });
    }

    @ApiOkResponse({status: 200, type: TransactionResponse})
    @Get(':hash')
    async show(@Param('hash') hash: string) {
        const tx = await this._transactionService.get(hash);
        if (!tx) {
            throw new NotFoundException('transaction_not_found');
        }

        return {
            result: plainToClass(TransactionResponse, tx)
        };
    }
}
