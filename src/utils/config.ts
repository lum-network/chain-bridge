import * as Joi from 'joi';

export const ConfigMap = {
    LUM_NETWORK_ENDPOINT: Joi.string().required(),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().required(),
    REDIS_PREFIX: Joi.string().optional(),
    INGEST_ENABLED: Joi.boolean().required(),
    INGEST_BACKWARD_ENABLED: Joi.boolean().required(),
    PUSH_NOTIF_ENABLED: Joi.boolean().required(),
    API_PORT: Joi.number().required(),
    SENTRY_DSN: Joi.string().optional(),
    FAUCET_MNEMONIC: Joi.string().optional()
}
