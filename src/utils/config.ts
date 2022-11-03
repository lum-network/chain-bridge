import * as Joi from 'joi';

export const ConfigMap = {
    ENV: Joi.string().optional().valid('development', 'mainnet', 'testnet').default('development'),
    LUM_NETWORK_ENDPOINT: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().optional(),
    INGEST_ENABLED: Joi.boolean().required(),
    INGEST_BACKWARD_ENABLED: Joi.boolean().required(),
    PUSH_NOTIF_ENABLED: Joi.boolean().required(),
    API_PORT: Joi.number().required(),
    SENTRY_DSN: Joi.string().optional(),
    FAUCET_MNEMONIC: Joi.string().optional(),
    STARTING_HEIGHT: Joi.number().required(),
};
