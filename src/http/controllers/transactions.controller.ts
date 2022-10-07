import { CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';

import { TransactionService } from '@app/services';

import { DefaultTake } from '@app/http/decorators';
import { DataResponse, DataResponseMetadata, TransactionResponse } from '@app/http/responses';
import { ExplorerRequest } from '@app/utils';

@ApiTags('transactions')
@Controller('transactions')
@UseInterceptors(CacheInterceptor)
export class TransactionsController {
    constructor(private readonly _transactionService: TransactionService) {}

    @ApiOkResponse({ status: 200, type: [TransactionResponse] })
    @DefaultTake(50)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [transactions, total] = await this._transactionService.fetch(request.pagination.skip, request.pagination.limit);
        if (!transactions) {
            throw new NotFoundException('transactions_not_found');
        }

        return new DataResponse({
            result: transactions.map((tx) => plainToInstance(TransactionResponse, tx)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: transactions.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: TransactionResponse })
    @Get(':hash')
    async show(@Param('hash') hash: string): Promise<DataResponse> {
        const tx = await this._transactionService.get(hash);
        if (!tx) {
            throw new NotFoundException('transaction_not_found');
        }

        return {
            result: plainToInstance(TransactionResponse, tx),
        };
    }
}
