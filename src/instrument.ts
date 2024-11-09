import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    debug: process.env.ENV === 'development',
    environment: process.env.ENV,
    tracesSampleRate: 1.0,
    attachStacktrace: true,
    dist: process.env.CHAIN_SLUG,
    integrations: [nodeProfilingIntegration()],
    profilesSampleRate: 1.0,
});
