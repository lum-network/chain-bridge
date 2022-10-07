import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { GovernanceProposalsVotesEntity } from '@app/database';

@Injectable()
export class GovernanceProposalsVotesService {
    constructor(@Inject('GOVERNANCE_PROPOSALS_VOTERS_REPOSITORY') private readonly _repository: Repository<GovernanceProposalsVotesEntity>) {}
}
