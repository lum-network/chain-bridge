require('dotenv').config();

export default class Config {
    constructor(private env: { [k: string]: string | undefined }) {
    }

    public getValue<T>(key: string, throwOnMissing = true): T {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`Config error - missing env.${key}`);
        }

        return value as unknown as T;
    }

    public ensureValues(keys: string[]) {
        keys.forEach(k => this.getValue(k, true));
        return this;
    }

    public getPort() {
        return this.getValue('PORT', true);
    }

    public isProduction() {
        const mode = this.getValue('MODE', false);
        return mode != 'DEV';
    }
}

const config = new Config(process.env)
    .ensureValues([
        'ELASTICSEARCH_HOST',
        'ELASTICSEARCH_PORT',
        'REDIS_HOST',
        'REDIS_PORT',
        'MODE',
        'PORT'
    ]);

export { config };
