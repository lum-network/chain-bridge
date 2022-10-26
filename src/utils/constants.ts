export const MODULE_NAMES = ['SyncConsumerModule', 'SyncSchedulerModule', 'ApiModule'];

export const CLIENT_PRECISION = 1_000_000_000_000_000_000;
export const TEN_EXPONENT_SIX = 1_000_000;
export const SIGNED_BLOCK_WINDOW = 10000;

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

export enum DfractAssetSymbol {
    COSMOS = 'ATOM',
    OSMOSIS = 'OSMO',
    JUNO = 'JUNO',
    EVMOS = 'EVMOS',
    COMDEX = 'CMDX',
    STARGAZE = 'STARS',
    AKASH_NETWORK = 'AKT',
    SENTINEL = 'DVPN',
    KI = 'XKI',
    LUM = 'LUM',
    DFR = 'DFR',
}

export enum DfractAssetName {
    COSMOS = 'cosmos',
    OSMOSIS = 'osmosis',
    JUNO = 'juno',
    EVMOS = 'evmos',
    COMDEX = 'comdex',
    STARGAZE = 'stars',
    AKASH_NETWORK = 'akash_network',
    SENTINEL = 'sentinel',
    KI = 'kichain',
    LUM = 'lum_network',
    DFR = 'dfract',
}

export enum DfractMicroDenum {
    COSMOS = 'uatom',
    OSMOSIS = 'uosmo',
    JUNO = 'ujuno',
    /*     EVMOS = 'aevmos', */
    COMDEX = 'ucmdx',
    STARGAZE = 'ustars',
    AKASH_NETWORK = 'uakt',
    SENTINEL = 'udvpn',
    KI = 'uxki',
    LUM = 'ulum',
    DFR = 'udfr',
}

export enum DfractDenum {
    COSMOS = 'atom',
    OSMOSIS = 'osmo',
    JUNO = 'juno',
    /*     EVMOS = 'aevmos', */
    COMDEX = 'ucmdx',
    STARGAZE = 'stars',
    AKASH_NETWORK = 'akt',
    SENTINEL = 'dvpn',
    KI = 'xki',
    LUM = 'lum',
    DFR = 'dfr',
}

// If we map the enums first, we encounter an error on the initialization onModuleInit
export const CHAIN_ENV_CONFIG = [
    'COSMOS_NETWORK_ENDPOINT',
    'OSMOSIS_NETWORK_ENDPOINT',
    'JUNO_NETWORK_ENDPOINT',
    'EVMOS_NETWORK_ENDPOINT',
    'STARGAZE_NETWORK_ENDPOINT',
    'AKASH_NETWORK_ENDPOINT',
    'COMDEX_NETWORK_ENDPOINT',
    'SENTINEL_NETWORK_ENDPOINT',
    'KICHAIN_NETWORK_ENDPOINT',
];
