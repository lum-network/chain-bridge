export const TEN_EXPONENT_SIX = 1_000_000;
export const SIGNED_BLOCK_WINDOW = 10000;

export const JOB_MAX_AGE = 60 * 60; // 1 hour

export enum BeamStatus {
    UNSPECIFIED,
    OPEN,
    CANCELED,
    CLOSED,
}

export enum ChartTypes {
    ASSET_VALUE = 'asset_value',
    REVIEWS_SUM = 'reviews_sum',
    REWARDS_SUM = 'rewards_sum',
    REWARDS_AVG = 'rewards_avg',
    REWARDS_LAST = 'rewards_last',
    MERCHANTS_LAST = 'merchants_last',
    WALLETS_TOP = 'wallets_top',
}

export enum MetricNames {
    // LUM enums
    COMMUNITY_POOL_SUPPLY = 'community_pool_supply',
    LUM_CURRENT_SUPPLY = 'lum_current_supply',
    MARKET_CAP = 'market_cap',
    LUM_PRICE_EUR = 'lum_price_eur',
    LUM_PRICE_USD = 'lum_price_usd',
    // Millions Enum
    MILLIONS_POOL_VALUE_LOCKED = 'millions_pool_value_locked',
    MILLIONS_POOL_DEPOSITORS = 'millions_pool_depositors',
    MILLIONS_POOL_PRIZE_WINNERS = 'millions_pool_prize_winners',
    MILLIONS_POOL_PRIZE_AMOUNT = 'millions_pool_prize_amount',
    MILLIONS_DEPOSITS = 'millions_deposits',
    MILLIONS_WITHDRAWALS = 'millions_withdrawals',
    // IBC Enum
    IBC_OPEN_CHANNELS = 'ibc_open_channels',
    IBC_CLOSED_CHANNELS = 'ibc_closed_channels',
    IBC_OTHER_CHANNELS = 'ibc_other_channels',
    IBC_PENDING_PACKETS = 'ibc_pending_packets',
    // General metrics enums
    DISCORD_MEMBERS = 'discord_members',
    TWITTER_FOLLOWERS = 'twitter_followers',
}

export enum ChartGroupType {
    GROUP_DAILY = 'daily',
    GROUP_MONTHLY = 'monthly',
    GROUP_YEARLY = 'yearly',
}

export enum Queues {
    BLOCKS = 'blocks',
    MILLIONS = 'millions',
    TRANSACTIONS = 'transactions',
}

export enum QueueJobs {
    INGEST = 'ingest',
    TRIGGER_VERIFY_BLOCKS_BACKWARD = 'trigger_verify_blocks_backward',
}

export enum QueuePriority {
    URGENT = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4,
}

export enum ApiUrl {
    GET_CHAIN_TOKENS_MCAP = 'https://api-osmosis.imperator.co/tokens/v2/mcap',
    GET_CHAIN_TOKENS = 'https://api-osmosis.imperator.co/tokens/v2',
    GET_LUM_PRICE = 'https://api.coingecko.com/api/v3/coins/lum-network',
}

export enum AssetSymbol {
    COSMOS = 'ATOM',
    AKASH_NETWORK = 'AKT',
    COMDEX = 'CMDX',
    SENTINEL = 'DVPN',
    KI = 'XKI',
    OSMOSIS = 'OSMO',
    JUNO = 'JUNO',
    STARGAZE = 'STARS',
    EVMOS = 'EVMOS',
    LUM = 'LUM',
    DFR = 'DFR',
}

export enum AssetPrefix {
    COSMOS = 'cosmos',
    AKASH_NETWORK = 'akash',
    COMDEX = 'comdex',
    SENTINEL = 'sent',
    KI = 'ki',
    OSMOSIS = 'osmo',
    JUNO = 'juno',
    STARGAZE = 'stars',
    EVMOS = 'evmos',
    LUM = 'lum',
    DFR = 'dfr',
}

export enum AssetMicroDenom {
    COSMOS = 'uatom',
    AKASH_NETWORK = 'uakt',
    COMDEX = 'ucmdx',
    SENTINEL = 'udvpn',
    KI = 'uxki',
    OSMOSIS = 'uosmo',
    JUNO = 'ujuno',
    STARGAZE = 'ustars',
    EVMOS = 'aevmos',
    LUM = 'ulum',
    DFR = 'udfr',
}

export enum AssetDenom {
    COSMOS = 'atom',
    AKASH_NETWORK = 'akt',
    COMDEX = 'cmdx',
    SENTINEL = 'dvpn',
    KI = 'xki',
    OSMOSIS = 'osmo',
    JUNO = 'juno',
    STARGAZE = 'stars',
    EVMOS = 'evmos',
    LUM = 'lum',
    DFR = 'dfr',
}

export enum MillionsMarketSymbol {
    COSMOS = 'ATOM',
    CRONOS = 'CRO',
    LUM = 'LUM',
    OSMOSIS = 'OSMO',
    STARGAZE = 'STARS',
}

export enum MillionsPoolState {
    UNSPECIFIED,
    CREATED,
    READY,
    PAUSED,
    KILLED,
    UNRECOGNIZED = -1,
}
