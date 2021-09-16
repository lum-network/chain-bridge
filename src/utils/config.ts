require('dotenv').config();

export class Config {
    constructor(private env: { [k: string]: string | undefined }) {}

    public getValue<T>(key: string, throwOnMissing = true): T {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`Config error - missing env.${key}`);
        }

        return (value as unknown) as T;
    }

    public ensureValues(keys: string[]) {
        keys.forEach(k => this.getValue(k, true));
        return this;
    }

    public getLumNetworkEndpoint = (): string => {
        return this.getValue<string>('LUM-NETWORK-ENDPOINT', true);
    };

    public getElasticSearchHost = (): string => {
        return this.getValue<string>('ELASTICSEARCH_HOST', true);
    };

    public getElasticSearchPort = (): number => {
        return this.getValue<number>('ELASTICSEARCH_PORT', true);
    };

    public getRedisHost = (): string => {
        return this.getValue<string>('REDIS_HOST', true);
    };

    public getRedisPort = (): number => {
        return this.getValue<number>('REDIS_PORT', true);
    };

    public getRedisPrefix = (): string => {
        return this.getValue<string>('REDIS_PREFIX', false).toLowerCase();
    };

    public isApiEnabled(): boolean {
        const enabled = this.getValue('API_ENABLED');
        return enabled === 'true' || enabled === true;
    }

    public getApiPort = (): number => {
        return this.getValue<number>('API_PORT', true);
    };

    public getFaucetMnemonic = (): string => {
        return this.getValue<string>('FAUCET_MNEMONIC', false);
    };

    public isIngestEnabled(): boolean {
        const enabled = this.getValue('INGEST_ENABLED');
        return enabled === 'true' || enabled === true;
    }

    public isIngestBackwardEnabled(): boolean {
        const enabled = this.getValue('INGEST_BACKWARD_ENABLED');
        return enabled === 'true' || enabled === true;
    }

    public isPushNotifEnabled(): boolean {
        const enabled = this.getValue('PUSH_NOTIF_ENABLED');
        return enabled === 'true' || enabled === true;
    }
}

const config = new Config(process.env).ensureValues([
    'LUM-NETWORK-ENDPOINT',
    'ELASTICSEARCH_HOST',
    'ELASTICSEARCH_PORT',
    'REDIS_HOST',
    'REDIS_PORT',
    'API_ENABLED',
    'API_PORT',
    'INGEST_ENABLED',
    'INGEST_BACKWARD_ENABLED',
    'PUSH_NOTIF_ENABLED',
]);

export { config };
