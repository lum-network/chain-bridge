import * as Joi from 'joi';

export const ConfigMap = {
    ENV: Joi.string().optional().valid('development', 'production').default('development'),
    PORT: Joi.number().required(),
    LUM_NETWORK_ENDPOINT: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().optional(),
    INGEST_ENABLED: Joi.boolean().required(),
    INGEST_BACKWARD_ENABLED: Joi.boolean().required(),
    DFRACT_SYNC_ENABLED: Joi.boolean().required(),
    GOVERNANCE_SYNC_ENABLED: Joi.boolean().required(),
    METRIC_SYNC_ENABLED: Joi.boolean().required(),
    VALIDATOR_SYNC_ENABLED: Joi.boolean().required(),
    SENTRY_DSN: Joi.string().optional(),
    STARTING_HEIGHT: Joi.number().required(),
    BULLBOARD_PASSWORD: Joi.string().required(),
};
