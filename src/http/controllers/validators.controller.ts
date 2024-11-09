import { Controller, Get, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { plainToInstance } from 'class-transformer';

import { BlockService, ChainService, ValidatorDelegationService, ValidatorService } from '@app/services';
import { DefaultTake } from '@app/http/decorators';
import { BalanceResponse, BlockResponse, DataResponse, DataResponseMetadata, DelegationResponse, ValidatorResponse } from '@app/http/responses';
import { AssetSymbol, ExplorerRequest } from '@app/utils';

@ApiTags('validators')
@Controller('validators')
@UseInterceptors(CacheInterceptor)
export class ValidatorsController {
    constructor(
        private readonly _blockService: BlockService,
        private readonly _chainService: ChainService,
        private readonly _validatorService: ValidatorService,
        private readonly _validatorDelegationService: ValidatorDelegationService,
    ) {}

    @ApiOkResponse({ type: () => [ValidatorResponse] })
    @DefaultTake(100)
    @Get('')
    async fetch(@Req() request: ExplorerRequest): Promise<DataResponse> {
        const [validators, total] = await this._validatorService.fetch(request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: validators.map((validator) => plainToInstance(ValidatorResponse, validator)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: validators.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: () => ValidatorResponse })
    @Get(':address')
    async show(@Param('address') address: string): Promise<DataResponse> {
        const result = await this._validatorService.getByOperatorAddress(address);
        return {
            result: plainToInstance(ValidatorResponse, result),
        };
    }

    @ApiOkResponse({ type: () => [BlockResponse] })
    @DefaultTake(50)
    @Get(':address/blocks')
    async showBlocks(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [blocks, total] = await this._blockService.fetchByOperatorAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: blocks.map((block) => plainToInstance(BlockResponse, block)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: blocks.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: () => [DelegationResponse] })
    @DefaultTake(50)
    @Get(':address/delegations')
    async showDelegations(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const [delegations, total] = await this._validatorDelegationService.fetchByValidatorAddress(address, request.pagination.skip, request.pagination.limit);
        return new DataResponse({
            result: delegations.map((del) => plainToInstance(DelegationResponse, del)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: delegations.length,
                items_total: total,
            }),
        });
    }

    @ApiOkResponse({ type: () => [BalanceResponse] })
    @DefaultTake(50)
    @Get(':address/rewards')
    async showRewards(@Req() request: ExplorerRequest, @Param('address') address: string): Promise<DataResponse> {
        const {
            rewards: { rewards },
        } = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.distribution.v1beta1.validatorOutstandingRewards({ validatorAddress: address });
        return new DataResponse({
            result: rewards.map((rwd) => plainToInstance(BalanceResponse, rwd)),
            metadata: new DataResponseMetadata({
                page: request.pagination.page,
                limit: request.pagination.limit,
                items_count: rewards.length,
                items_total: null,
            }),
        });
    }
}
