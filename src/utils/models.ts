export interface VersionedChainDocument {
    chain_id: string;
    doc_version: number;
}

export interface BlockDocument extends VersionedChainDocument {
    hash: string;
    height: number;
    time: string;
    tx_count: number;
    tx_hashes: string[];
    proposer_address: string;
    operator_address?: string;
    raw_block: any;
}

export interface TransactionDocument extends VersionedChainDocument {
    hash: string;
    height: number;
    time: string;
    proposer_address: string;
    operator_address?: string;
    block_hash: string;
    success: boolean;
    code: number;
    fees: { amount: number; denom: string }[];
    gas_wanted: number;
    gas_used: number;
    amount?: { amount: number; denom: string };
    addresses: string[];
    memo: string;
    messages: { typeUrl: string; value: any }[];
    message_type: string;
    messages_count: number;
    raw_logs: any[];
    raw_events: any[];
    raw_tx: any;
    raw_tx_data: any;
}

export interface ValidatorDocument extends VersionedChainDocument {
    proposer_address: string;
    consensus_address: string;
    consensus_pubkey: string;
    operator_address?: string;
    account_address?: string;
}