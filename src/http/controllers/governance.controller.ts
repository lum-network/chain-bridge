import {CacheInterceptor, Controller, Get, NotFoundException, Param, Req, UseInterceptors} from '@nestjs/common';
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";

import {plainToClass} from 'class-transformer';

import {ProposalStatus} from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';

import {LumNetworkService} from '@app/services';
import {DataResponse, DataResponseMetadata, ProposalResponse, ResultResponse} from '@app/http/responses/';
import {decodeContent, ExplorerRequest} from '@app/utils';

@ApiTags('governance')
@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {
    }

    @Get('proposals')
    async fetch(@Req() request: ExplorerRequest) {
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

        return plainToClass(DataResponse, {
            result: results.proposals.map((proposal) => plainToClass(ProposalResponse, decodeContent(proposal))),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: results.proposals.length,
                items_total: null,
            })
        })
    }

    @ApiOkResponse({status: 200, type: ProposalResponse})
    @Get('proposals/:id')
    async get(@Param('id') id: string) {
        const result = await this._lumNetworkService.client.queryClient.gov.proposal(id);

        if (!result || !result.proposal) {
            throw new NotFoundException('proposal_not_found');
        }

        return {
            result: plainToClass(ProposalResponse, decodeContent(result.proposal))
        };
    }

    @ApiOkResponse({status: 200, type: ResultResponse})
    @Get('proposals/:id/tally')
    async getTallyResults(@Param('id') id: string) {
        const result = await this._lumNetworkService.client.queryClient.gov.tally(id);

        if (!result || !result.tally) {
            throw new NotFoundException('tally_not_found');
        }

        return {
            result: plainToClass(ResultResponse, result.tally)
        };
    }
}
