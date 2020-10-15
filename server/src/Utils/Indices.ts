export const IndexBlocksMapping = {
    "mappings": {
        "properties": {
            "chain_id": {"type": "keyword"},
            "hash": {"type": "keyword"},
            "height": {"type": "double"},
            "dispatched_at": {"type": "date", "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"},
            "num_txs": {"type": "double"},
            "total_txs": {"type": "double"},
            "proposer_address": {"type": "keyword"},
            "raw": {"type": "text"},
            "transactions": {"type": "text"}
        }
    }
};

export const IndexValidatorsMapping = {
    "mappings": {
        "properties": {
            "address_consensus": {"type": "keyword"},
            "address_consensus_pub": {"type": "text"},
            "address_operator": {"type": "keyword"},
            "address_operator_pub": {"type": "text"}
        }
    }
};
