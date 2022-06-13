export const POST_FORK_HEIGHT = 1960666;

export enum Queues {
    QUEUE_DEFAULT = 'default',
    QUEUE_FAUCET = 'faucet',
}

export enum QueueJobs {
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
