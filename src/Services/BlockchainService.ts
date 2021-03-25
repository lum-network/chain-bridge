import SandblockChainClient from 'sandblock-chain-sdk-js/dist/client';

export default class BlockchainService {
    private static _instance: BlockchainService;
    private _client: SandblockChainClient;
    constructor() {
        this._client = new SandblockChainClient();
    }

    public static getInstance = (): BlockchainService => {
        if (!BlockchainService._instance) {
            BlockchainService._instance = new BlockchainService();
        }
        return BlockchainService._instance;
    };

    public getClient(): SandblockChainClient {
        return this._client;
    }
}
