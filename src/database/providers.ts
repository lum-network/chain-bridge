import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import {
    AssetEntity,
    BeamEntity,
    BlockEntity,
    MarketEntity,
    MillionsBiggestWinnerEntity,
    MillionsCampaignEntity,
    MillionsCampaignMemberEntity,
    MillionsDepositEntity,
    MillionsDepositorEntity,
    MillionsDrawEntity,
    MillionsPoolEntity,
    MillionsPrizeEntity,
    ProposalDepositEntity,
    ProposalEntity,
    ProposalVoteEntity,
    TransactionEntity,
    ValidatorDelegationEntity,
    ValidatorEntity,
} from '@app/database/entities';

export const DatabaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
            AssetEntity,
            BeamEntity,
            BlockEntity,
            MarketEntity,
            MillionsBiggestWinnerEntity,
            MillionsCampaignEntity,
            MillionsCampaignMemberEntity,
            MillionsDepositEntity,
            MillionsDepositorEntity,
            MillionsDrawEntity,
            MillionsPoolEntity,
            MillionsPrizeEntity,
            ProposalEntity,
            ProposalDepositEntity,
            ProposalVoteEntity,
            TransactionEntity,
            ValidatorDelegationEntity,
            ValidatorEntity,
        ],
        synchronize: true,
        logging: false,
        extra:
            configService.get('MODE') === 'production'
                ? {
                      ssl: {
                          rejectUnauthorized: false,
                      },
                  }
                : {},
    }),
};

export const DatabaseFeatures = [
    AssetEntity,
    BeamEntity,
    BlockEntity,
    MarketEntity,
    MillionsBiggestWinnerEntity,
    MillionsCampaignEntity,
    MillionsCampaignMemberEntity,
    MillionsDepositEntity,
    MillionsDepositorEntity,
    MillionsDrawEntity,
    MillionsPoolEntity,
    MillionsPrizeEntity,
    ProposalEntity,
    ProposalDepositEntity,
    ProposalVoteEntity,
    TransactionEntity,
    ValidatorDelegationEntity,
    ValidatorEntity,
];
