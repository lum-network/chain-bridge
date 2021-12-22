/**
 * Document version to store during ingestion
 * This number should only be incremented in case one of the document model changes
 * Incrementing this number will force re-ingest all data ingested with a previous versioning
 */
export const IngestionDocumentVersion = 1;

export enum ElasticIndexes {
    INDEX_BLOCKS = 'blocks',
    INDEX_TRANSACTIONS = 'transactions',
    INDEX_VALIDATORS = 'validators',
}

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

export const OSMOSIS_API_URL = 'https://api-osmosis.imperator.co';
