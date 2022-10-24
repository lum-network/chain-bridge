import { ConfigModule, ConfigService } from '@nestjs/config';

import { SentryModuleAsyncOptions } from '@ntegral/nestjs-sentry';

export const SentryModuleOptions: SentryModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        dsn: configService.get<string>('SENTRY_DSN'),
        debug: configService.get<string>('ENV') === 'development',
        environment: configService.get<string>('ENV'),
        tracesSampleRate: 1.0,
    }),
};
