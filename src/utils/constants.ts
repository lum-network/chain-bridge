export const CLIENT_PRECISION = 1_000_000_000_000_000_000;
export const SIGNED_BLOCK_WINDOW = 10000;

export enum BeamStatus {
    UNSPECIFIED,
    OPEN,
    CANCELED,
    CLOSED
}

export enum Queues {
    QUEUE_BEAMS = 'beams',
    QUEUE_BLOCKS = 'blocks',
    QUEUE_FAUCET = 'faucet',
    QUEUE_NOTIFICATIONS = 'notifications'
}

export enum QueueJobs {
    INGEST_BEAM = 'ingest_beam',
    INGEST_BLOCK = 'ingest_block',
    TRIGGER_VERIFY_BLOCKS_BACKWARD = 'trigger_verify_blocks_backward',
    NOTIFICATION_SOCKET = 'push_notification',
    MINT_FAUCET_REQUEST = 'mint_faucet_request',
}

export enum NotificationChannels {
    CHANNEL_BLOCKS = 'blocks',
    CHANNEL_TRANSACTIONS = 'transactions',
}

export enum NotificationEvents {
    EVENT_NEW_BLOCK = 'new-block',
    EVENT_NEW_TRANSACTION = 'new-transaction',
}
