export const MODULE_NAMES = ['SyncConsumerModule', 'SyncSchedulerModule', 'ApiModule'];

export const CLIENT_PRECISION = 1_000_000_000_000_000_000;
export const TEN_EXPONENT_SIX = 1_000_000;
export const SIGNED_BLOCK_WINDOW = 10000;
export const PERCENTAGE = 100;

export const LUM_STAKING_ADDRESS = 'lum1euhszjasgkeskujz6zr42r3lsxv58mfgsmlps0';
export const EVMOS_STAKING_ADDRESS = 'evmos1evap49dune5ffh6w3h6ueqv9hyyyyeargtp6gw';

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
    // DFR enums
    DFRACT_BACKING_PRICE = 'dfract_backing_price',
    DFRACT_CURRENT_SUPPLY = 'dfract_current_supply',
    DFRACT_MA_BALANCE = 'dfract_ma_balance',
    DFRACT_MARKET_CAP = 'dfract_market_cap',
    DFRACT_MINT_RATIO = 'dfract_mint_ratio',
    DFRACT_APY = 'dfract_apy',
    DFRACT_NEW_DFR_TO_MINT = 'dfract_new_dfr_to_mint',
    // LUM enums
    LUM_CURRENT_SUPPLY = 'lum_current_supply',
    LUM_COMMUNITY_POOL_SUPPLY = 'LUM_COMMUNITY_POOL_SUPPLY',
    LUM_MARKET_CAP = 'lum_market_cap',
    LUM_PRICE_USD = 'lum_price_usd',
    LUM_PRICE_EUR = 'lum_price_eur',
    // General metrics enums
    TWITTER_FOLLOWERS = 'twitter_followers',
    DISCORD_MEMBERS = 'discord_members',
}

export enum ChartGroupType {
    GROUP_DAILY = 'daily',
    GROUP_MONTHLY = 'monthly',
    GROUP_YEARLY = 'yearly',
}

export enum Queues {
    BEAMS = 'beams',
    BLOCKS = 'blocks',
    FAUCET = 'faucet',
    NOTIFICATIONS = 'notifications',
}

export enum QueueJobs {
    INGEST = 'ingest',
    TRIGGER_VERIFY_BLOCKS_BACKWARD = 'trigger_verify_blocks_backward',
    NOTIFICATION_SOCKET = 'push_notification',
    MINT_FAUCET_REQUEST = 'mint_faucet_request',
}

export enum QueuePriority {
    URGENT = 1,
    HIGH = 2,
    NORMAL = 3,
}

export enum NotificationChannels {
    BLOCKS = 'blocks',
    TRANSACTIONS = 'transactions',
}

export enum NotificationEvents {
    NEW_BLOCK = 'new-block',
    NEW_TRANSACTION = 'new-transaction',
}

export enum ApiUrl {
    GET_EVMOS_INFLATION = 'https://rest.bd.evmos.org:1317/evmos/inflation/v1/inflation_rate',
    GET_EVMOS_SUPPLY = 'https://rest.bd.evmos.org:1317/evmos/inflation/v1/circulating_supply',
    GET_CHAIN_TOKENS_MCAP = 'https://api-osmosis.imperator.co/tokens/v2/mcap',
    GET_CHAIN_TOKENS_ALL = 'https://api-osmosis.imperator.co/tokens/v2/all',
    GET_LUM_PRICE = 'https://api.coingecko.com/api/v3/coins/lum-network',
    GET_JUNO_APY = 'https://supply-api.junonetwork.io/apr',
    GET_OSMOSIS_APY = 'https://api-osmosis.imperator.co/apr/v2/staking',
    GET_STARGAZE_APY = 'https://supply-api.publicawesome.dev/apr',
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

export enum AssetMicroDenum {
    COSMOS = 'uatom',
    AKASH_NETWORK = 'uakt',
    COMDEX = 'ucmdx',
    SENTINEL = 'udvpn',
    KI = 'uxki',
    OSMOSIS = 'uosmo',
    JUNO = 'ujuno',
    STARGAZE = 'ustars',
    EVMOS = 'aevmos',
    DFR = 'udfr',
}

export enum AssetDenum {
    DFR = 'dfr',
}

export enum DfractOnChainApy {
    COSMOS = 'atom',
    AKASH_NETWORK = 'akt',
    COMDEX = 'ucmdx',
    SENTINEL = 'dvpn',
    KI = 'xki',
}

// If we map the enums first, we encounter an error on the initialization onModuleInit
// Hence, we hardcod the endpoint env
export const CHAIN_ENV_CONFIG = [
    'COSMOS_NETWORK_ENDPOINT',
    'AKASH_NETWORK_ENDPOINT',
    'COMDEX_NETWORK_ENDPOINT',
    'SENTINEL_NETWORK_ENDPOINT',
    'KICHAIN_NETWORK_ENDPOINT',
    'OSMOSIS_NETWORK_ENDPOINT',
    'JUNO_NETWORK_ENDPOINT',
    'STARGAZE_NETWORK_ENDPOINT',
    'EVMOS_NETWORK_ENDPOINT',
];

// Lum endpoint
export const LUM_ENV_CONFIG = 'LUM_NETWORK_ENDPOINT';
