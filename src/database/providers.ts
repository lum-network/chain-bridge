import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import { BeamEntity, BlockEntity, ProposalDepositEntity, ProposalVoteEntity, TransactionEntity, ValidatorDelegationEntity, ValidatorEntity } from '@app/database/entities';

export const DatabaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [BeamEntity, BlockEntity, ProposalDepositEntity, ProposalVoteEntity, TransactionEntity, ValidatorEntity, ValidatorDelegationEntity],
        synchronize: true,
        logging: false,
    }),
};

export const DatabaseFeatures = [BeamEntity, BlockEntity, ProposalDepositEntity, ProposalVoteEntity, TransactionEntity, ValidatorEntity, ValidatorDelegationEntity];
