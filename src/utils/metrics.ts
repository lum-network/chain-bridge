import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

import { MetricNames } from '@app/utils/constants';

export const metrics = [
    // LUM Metrics
    makeGaugeProvider({
        name: MetricNames.LUM_COMMUNITY_POOL_SUPPLY,
        help: 'Current supply of community pool',
    }),
    makeGaugeProvider({
        name: MetricNames.LUM_CURRENT_SUPPLY,
        help: 'Current supply of ulum',
    }),
    makeGaugeProvider({
        name: MetricNames.LUM_MARKET_CAP,
        help: 'Current market cap of LUM',
    }),
    makeGaugeProvider({
        name: MetricNames.LUM_PRICE_USD,
        help: 'Current price of LUM in USD',
    }),
    makeGaugeProvider({
        name: MetricNames.LUM_PRICE_EUR,
        help: 'Current price of LUM in EUR',
    }),
    // DFR Metrics
    makeGaugeProvider({
        name: MetricNames.DFRACT_APY,
        help: 'Current apy for Dfract in USD',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_BACKING_PRICE,
        help: 'Current dfr backing price in USD',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_CURRENT_SUPPLY,
        help: 'Current supply of udfr',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_MARKET_CAP,
        help: 'Current dfr market cap in USD',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_MA_BALANCE,
        help: 'Current balance of dfract Module Account',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_MINT_RATIO,
        help: 'Current Dfract mint ratio',
    }),
    makeGaugeProvider({
        name: MetricNames.DFRACT_NEW_DFR_TO_MINT,
        help: 'Current number of DFR to mint',
    }),
    // General Metrics
    makeGaugeProvider({
        name: MetricNames.DISCORD_MEMBERS,
        help: 'Current number of Discord members',
    }),
    makeGaugeProvider({
        name: MetricNames.TWITTER_FOLLOWERS,
        help: 'Current number of Twitter followers',
    }),
];
