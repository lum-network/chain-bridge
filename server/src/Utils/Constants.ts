export enum ElasticIndexes {
    INDEX_BLOCKS = 'blocks',
    INDEX_MIGRATIONS = 'migrations',
    INDEX_TRANSACTIONS = 'transactions',
    INDEX_VALIDATORS = 'validators'
};

export enum Queues {
    QUEUE_DEFAULT = 'default'
};

export enum QueueJobs {
    INGEST_BLOCK = 'ingest_block',
    INGEST_TRANSACTION = 'ingest_transaction'
}
