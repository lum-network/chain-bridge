export const MODULE_NAMES = ['SyncConsumerModule', 'SyncSchedulerModule', 'ApiModule'];

export const CLIENT_PRECISION = 1_000_000_000_000_000_000;
export const TEN_EXPONENT_SIX = 1_000_000;
export const SIGNED_BLOCK_WINDOW = 10000;

export const LUM_STAKING_ADDRESS = 'lum1euhszjasgkeskujz6zr42r3lsxv58mfgsmlps0';

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
    COSMOS = 'Cosmos',
    OSMOSIS = 'Osmosis',
    JUNO = 'Juno',
    EVMOS = 'Evmos',
    COMDEX = 'Comdex',
    STARGAZE = 'Stars',
    AKASH_NETWORK = 'Akash_Network',
    SENTINEL = 'Sentinel',
    KI = 'Ki',
    LUM = 'Lum_Network',
    DFR = 'Dfract',
}
