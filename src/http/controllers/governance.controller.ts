import { CacheInterceptor, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { LumNetworkService } from '@app/services';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { plainToClass } from 'class-transformer';
import { ProposalResponse } from '@app/http/responses/proposal.response';

@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Get('proposals')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();

        const results = await lumClt.queryClient.gov.proposals(
            ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED |
                ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD |
                ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD |
                ProposalStatus.PROPOSAL_STATUS_PASSED |
                ProposalStatus.PROPOSAL_STATUS_REJECTED |
                ProposalStatus.PROPOSAL_STATUS_FAILED |
                ProposalStatus.UNRECOGNIZED,
            '',
            '',
        );

        return results.proposals.map(proposal => plainToClass(ProposalResponse, proposal));
    }

    @Get('proposals/:id')
    async get(@Param('id') id: string) {
        const lumClt = await this._lumNetworkService.getClient();

        const result = await lumClt.queryClient.gov.proposal(id);

        return plainToClass(ProposalResponse, result.proposal);
    }
}
