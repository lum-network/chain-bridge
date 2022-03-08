export const IndexBlocksMapping = {
    mappings: {
        properties: {
            chain_id: { type: 'keyword' },
            hash: { type: 'keyword' },
            height: { type: 'integer' },
            time: { type: 'date' },
            tx_count: { type: 'integer' },
            tx_hashes: { type: 'keyword' },
            proposer_address: { type: 'keyword' },
            operator_address: { type: 'keyword' },
            raw_block: { type: 'object' },
        },
    },
};

export const IndexValidatorsMapping = {
    mappings: {
        properties: {
            proposer_address: { type: 'keyword' },
            consensus_address: { type: 'keyword' },
            consensus_pubkey: { type: 'keyword' },
            operator_address: { type: 'keyword' },
        },
    },
};

export const IndexTransactionsMapping = {
    mappings: {
        properties: {
            hash: { type: 'keyword' },
            height: { type: 'integer' },
            time: { type: 'date' },
            proposer_address: { type: 'keyword' },
            operator_address: { type: 'keyword' },
            block_hash: { type: 'keyword' },
            success: { type: 'boolean' },
            code: { type: 'integer' },
            fees: {
                type: 'object',
                properties: {
                    denom: { type: 'keyword' },
                    amount: { type: 'double' },
                },
            },
            gas_wanted: { type: 'integer' },
            gas_used: { type: 'integer' },
            addresses: { type: 'keyword' },
            memo: { type: 'keyword' },
            messages: { type: 'object' },
            raw_logs: { type: 'object' },
            raw_events: { type: 'object' },
            raw_tx: { type: 'object' },
            raw_tx_data: { type: 'object' },
        },
    },
};

export const IndexBeamsMapping = {
    mappings: {
        properties: {
            creator_address: { type: 'keyword' },
            id: { type: 'keyword' },
            status: { type: 'integer' },
            secret: { type: 'keyword' },
            claim_address: { type: 'keyword' },
            funds_withdrawn: { type: 'boolean' },
            claimed: { type: 'boolean' },
            cancel_reason: { type: 'keyword' },
            hide_content: { type: 'boolean' },
            schema: { type: 'keyword' },
            claim_expires_at_block: { type: 'integer' },
            closes_at_block: { type: 'integer' },
            amount: {
                type: 'object',
                properties: {
                    denom: { type: 'keyword' },
                    amount: { type: 'double' },
                },
            },
            data: { type: 'object' },
        },
    },
};
