import { CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';

import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import { GovernanceProposalsVotesService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata, ProposalResponse, ProposalVotersResponse, ResultResponse } from '@app/http/responses/';
import { decodeContent, ExplorerRequest } from '@app/utils';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('governance')
@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _governanceProposalsVotesService: GovernanceProposalsVotesService) {}

    @ApiOkResponse({ status: 200, type: [ProposalResponse] })
    @Get('proposals')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const results = await this._lumNetworkService.client.queryClient.gov.proposals(
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

        return new DataResponse({
            result: results.proposals.map((proposal) => plainToInstance(ProposalResponse, decodeContent(proposal))),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: results.proposals.length,
                items_total: null,
            }),
        });
    }

    @ApiOkResponse({ status: 200, type: ProposalResponse })
    @Get('proposals/:id')
    async get(@Param('id') id: string): Promise<DataResponse> {
        const result = await this._lumNetworkService.client.queryClient.gov.proposal(id);

        if (!result || !result.proposal) {
            throw new NotFoundException('proposal_not_found');
        }

        return {
            result: plainToInstance(ProposalResponse, decodeContent(result.proposal)),
        };
    }

    @ApiOkResponse({ status: 200, type: ResultResponse })
    @Get('proposals/:id/tally')
    async getTallyResults(@Param('id') id: string): Promise<DataResponse> {
        const result = await this._lumNetworkService.client.queryClient.gov.tally(id);

        if (!result || !result.tally) {
            throw new NotFoundException('tally_not_found');
        }

        return {
            result: plainToInstance(ResultResponse, result.tally),
        };
    }

    @ApiOkResponse({ status: 200, type: ProposalVotersResponse })
    @DefaultTake(100)
    @Get('proposals/:id/voters')
    async getVoters(@Req() request: ExplorerRequest, @Param('id') id: string): Promise<DataResponse> {
        const [voters, total] = await this._governanceProposalsVotesService.fetchVotersByProposalId(id, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: voters,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: voters.length,
                items_total: total,
            }),
        });
    }
}
