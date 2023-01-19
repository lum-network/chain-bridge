import { GenericChain } from '@app/services/chains/generic.chain';
import { ApiUrl } from '@app/utils';

export class LumChain extends GenericChain {
    getMarketCap = async (): Promise<number> => {
        const [supply, unit_price_usd] = await Promise.all([this.getTokenSupply(), this.getPrice()]);
        return supply * unit_price_usd.market_data.current_price.usd;
    };

    getPrice = async (): Promise<any> => {
        const response = await fetch(ApiUrl.GET_LUM_PRICE);
        const data = await response.json();
        return data.data;
    };

    getPriceHistory = async (startAt: number, endAt: number): Promise<any[]> => {
        const response = await fetch(`${ApiUrl.GET_LUM_PRICE}/market_chart/range?vs_currency=usd&from=${startAt}&to=${endAt}`);
        const data = await response.json();
        return data.prices.map((price) => {
            return {
                key: String(price[0]),
                value: Number(price[1]),
            };
        });
    };
}
