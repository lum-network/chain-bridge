import { CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';

import { ProposalDepositService, ProposalVoteService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata, DepositorResponse, ProposalResponse, VoterResponse, ResultResponse } from '@app/http/responses/';
import { decodeContent, ExplorerRequest } from '@app/utils';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('governance')
@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _governanceProposalVoteService: ProposalVoteService,
        private readonly _governanceProposalDepositService: ProposalDepositService,
    ) {}

    @ApiOkResponse({ status: 200, type: [ProposalResponse] })
    @Get('proposals')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const results = await this._lumNetworkService.getProposals();

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

    @ApiOkResponse({ status: 200, type: VoterResponse })
    // Return only 5 voters per page
    @DefaultTake(5)
    @Get('proposals/:id/voters')
    async getVoters(@Req() request: ExplorerRequest, @Param('id') id: string): Promise<DataResponse> {
        // Get voters and total for pagination
        const [voters, total] = await this._governanceProposalVoteService.fetchVotersByProposalId(id, request.pagination.skip, request.pagination.limit);

        // return formated result and metadata
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

    @ApiOkResponse({ status: 200, type: DepositorResponse })
    // Return only 5 depositors per page
    @DefaultTake(5)
    @Get('proposals/:id/depositors')
    async getDepositors(@Req() request: ExplorerRequest, @Param('id') id: string): Promise<DataResponse> {
        // Get depositors and total for pagination
        const [depositors, total] = await this._governanceProposalDepositService.fetchDepositorsByProposalId(id, request.pagination.skip, request.pagination.limit);

        // return formated result and metadata
        return new DataResponse({
            result: depositors,
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: depositors.length,
                items_total: total,
            }),
        });
    }
}
