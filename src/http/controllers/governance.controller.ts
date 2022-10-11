import { CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';

import { ProposalsDepositsService, ProposalsVotesService, LumNetworkService } from '@app/services';
import { DataResponse, DataResponseMetadata, ProposalDepositorsResponse, ProposalResponse, ProposalVotersResponse, ResultResponse } from '@app/http/responses/';
import { decodeContent, ExplorerRequest, ProposalsSync } from '@app/utils';
import { DefaultTake } from '@app/http/decorators';

@ApiTags('governance')
@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(
        private readonly _lumNetworkService: LumNetworkService,
        private readonly _governanceProposalsVotesService: ProposalsVotesService,
        private readonly _governanceProposalsDepositsService: ProposalsDepositsService,
    ) {}

    @ApiOkResponse({ status: 200, type: [ProposalResponse] })
    @Get('proposals')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const results = await new ProposalsSync(this._lumNetworkService).getProposals();
        const getVotes = await this._lumNetworkService.client.queryClient.gov.vote(21, 'lum14a3kmsuu75njmfe3xj9wt5sld5gw88vdfrn9kv');
        /*         const getDeposits = await this._lumNetworkService.client.queryClient.gov.deposits(21); */
        console.log('====getVotes===', getVotes);

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

        if (!voters) {
            throw new NotFoundException('no voters');
        }

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

    @ApiOkResponse({ status: 200, type: ProposalDepositorsResponse })
    @DefaultTake(100)
    @Get('proposals/:id/depositors')
    async getDepositors(@Req() request: ExplorerRequest, @Param('id') id: string): Promise<DataResponse> {
        const [depositors, total] = await this._governanceProposalsDepositsService.fetchDepositorsByProposalId(id, request.pagination.skip, request.pagination.limit);
        const getVotes = await this._lumNetworkService.client.queryClient.gov.votes(21);

        console.log(getVotes);

        if (!depositors) {
            throw new NotFoundException('no voters');
        }

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
