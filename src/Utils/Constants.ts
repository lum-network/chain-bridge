export enum ElasticIndexes {
    INDEX_BLOCKS = 'blocks',
    INDEX_MIGRATIONS = 'migrations',
    INDEX_TRANSACTIONS = 'transactions',
    INDEX_VALIDATORS = 'validators',
}

export enum Queues {
    QUEUE_DEFAULT = 'default',
}

export enum QueueJobs {
    INGEST_BLOCK = 'ingest_block',
    INGEST_TRANSACTION = 'ingest_transaction',
    NOTIFICATION_SOCKET = 'notification_socket',
}

export enum NotificationChannels {
    CHANNEL_BLOCKS = 'blocks',
    CHANNEL_TRANSACTIONS = 'transactions',
}

export enum NotificationEvents {
    EVENT_NEW_BLOCK = 'new-block',
    EVENT_NEW_TRANSACTION = 'new-transaction',
}
