import { CacheInterceptor, Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';

import { plainToClass } from 'class-transformer';

import { TransactionService } from '@app/services';
import { TransactionResponse } from '@app/http/responses';

@Controller('transactions')
@UseInterceptors(CacheInterceptor)
export class TransactionsController {
    constructor(private readonly _transactionService: TransactionService) {}

    @Get('')
    async fetch() {
        const transactions = await this._transactionService.fetch();
        if (!transactions) {
            throw new NotFoundException('transactions_not_found');
        }

        return transactions.map((tx) => plainToClass(TransactionResponse, tx._source));
    }

    @Get(':hash')
    async show(@Param('hash') hash: string) {
        const tx = await this._transactionService.get(hash);
        if (!tx) {
            throw new NotFoundException('transaction_not_found');
        }

        return plainToClass(TransactionResponse, tx);
    }
}
