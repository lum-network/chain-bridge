import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

import { MetricNames } from '@app/utils/constants';

export const metrics = [
    // LUM Metrics
    makeGaugeProvider({
        name: MetricNames.COMMUNITY_POOL_SUPPLY,
        help: 'Current supply of community pool',
    }),
    makeGaugeProvider({
        name: MetricNames.LUM_CURRENT_SUPPLY,
        help: 'Current supply of ulum',
    }),
    makeGaugeProvider({
        name: MetricNames.MARKET_CAP,
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
    // Millions Metrics
    makeGaugeProvider({
        name: MetricNames.MILLIONS_POOL_VALUE_LOCKED,
        help: 'Current value locked in millions pool',
        labelNames: ['pool_id'],
    }),
    makeGaugeProvider({
        name: MetricNames.MILLIONS_POOL_DEPOSITORS,
        help: 'Current number of depositors in millions pool',
        labelNames: ['pool_id'],
    }),
    makeGaugeProvider({
        name: MetricNames.MILLIONS_POOL_PRIZE_AMOUNT,
        help: 'Current prize amount in millions pool',
        labelNames: ['pool_id', 'draw_id'],
    }),
    makeGaugeProvider({
        name: MetricNames.MILLIONS_POOL_PRIZE_WINNERS,
        help: 'Current number of prize winners in millions pool',
        labelNames: ['pool_id', 'draw_id'],
    }),
    makeGaugeProvider({
        name: MetricNames.MILLIONS_DEPOSITS,
        help: 'Current number of deposits in millions',
        labelNames: ['deposit_state'],
    }),
    makeGaugeProvider({
        name: MetricNames.MILLIONS_WITHDRAWALS,
        help: 'Current number of withdrawals in millions',
        labelNames: ['withdrawal_state'],
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
    makeGaugeProvider({
        name: MetricNames.IBC_OPEN_CHANNELS,
        help: 'Current number of open IBC channels',
    }),
    makeGaugeProvider({
        name: MetricNames.IBC_CLOSED_CHANNELS,
        help: 'Current number of closed IBC channels',
    }),
    makeGaugeProvider({
        name: MetricNames.IBC_OTHER_CHANNELS,
        help: 'Current number of other IBC channels in unknown state',
    }),
    makeGaugeProvider({
        name: MetricNames.IBC_PENDING_PACKETS,
        help: 'Current number of pending IBC packets',
    }),
];
