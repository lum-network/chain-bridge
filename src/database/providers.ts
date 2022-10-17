import { ConfigModule, ConfigService } from '@nestjs/config';

import { Connection, createConnection } from 'typeorm';

import { BeamEntity, BlockEntity, ProposalDepositEntity, ProposalVoteEntity, TransactionEntity, ValidatorDelegationEntity, ValidatorEntity } from '@app/database/entities';

export const databaseProviders = [
    {
        provide: 'DATABASE_CONNECTION',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
            createConnection({
                type: 'postgres',
                host: configService.get<string>('DATABASE_HOST'),
                port: configService.get<number>('DATABASE_PORT'),
                username: configService.get<string>('DATABASE_USER'),
                password: configService.get<string>('DATABASE_PASSWORD'),
                database: configService.get<string>('DATABASE_NAME'),
                entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
                synchronize: true,
            }),
        inject: [ConfigService],
    },
    {
        provide: 'BEAM_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(BeamEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'BLOCK_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(BlockEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'TRANSACTION_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(TransactionEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'VALIDATOR_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(ValidatorEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'VALIDATOR_DELEGATION_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(ValidatorDelegationEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'PROPOSAL_VOTE_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(ProposalVoteEntity),
        inject: ['DATABASE_CONNECTION'],
    },
    {
        provide: 'PROPOSAL_DEPOSIT_REPOSITORY',
        useFactory: (connection: Connection) => connection.getRepository(ProposalDepositEntity),
        inject: ['DATABASE_CONNECTION'],
    },
];
