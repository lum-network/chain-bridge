import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MarketService } from '@app/services';
import { MillionsMarketSymbol, getMillionsMarketSymbol } from '@app/utils';
import { MarketData } from '@app/database';

@Injectable()
export class MarketScheduler {
    private _logger: Logger = new Logger(MarketScheduler.name);

    constructor(private readonly _configService: ConfigService, private readonly _marketService: MarketService) {}

    @Cron(CronExpression.EVERY_HOUR)
    async MarketSync() {
        if (!this._configService.get<boolean>('MARKET_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`[Market] Syncing price market data...`);

        const data: MarketData[] = [];

        for (const symbol of Object.values(MillionsMarketSymbol)) {
            const price = await this._marketService.getTokenPrice(getMillionsMarketSymbol(symbol));

            // Exit if any missing data
            if (!price) {
                this._logger.error(`[Market] Price for ${symbol} not found`);
                return;
            }

            // Collect the prices
            data.push({
                denom: symbol.toLocaleLowerCase(),
                price,
            });

            this._logger.debug(`[Market] Fetched price market data for ${symbol}`);
        }

        await this._marketService.createMarketData(data);
        this._logger.debug(`[Market] Persisted price market data for all symbols`);
    }
}
