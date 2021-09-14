import { CacheInterceptor, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { LumNetworkService } from '@app/services';
import { ProposalStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { LumConstants, LumMessages } from '@lum-network/sdk-javascript';

@Controller('governance')
@UseInterceptors(CacheInterceptor)
export class GovernanceController {
    constructor(private readonly _lumNetworkService: LumNetworkService) {}

    @Get('proposals')
    async fetch() {
        const lumClt = await this._lumNetworkService.getClient();

        const results = await lumClt.queryClient.gov.proposals(
            ProposalStatus.PROPOSAL_STATUS_PASSED |
                ProposalStatus.PROPOSAL_STATUS_FAILED |
                ProposalStatus.PROPOSAL_STATUS_REJECTED |
                ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED |
                ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD |
                ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
            '',
            '',
        );

        return results;
    }

    // @Post('message')
    // async message() {
    //     const lumClt = await this._lumNetworkService.getClient();
    //
    //     const msg = LumMessages.BuildMsgSubmitProposal('lum1kqypcqjpcyd7e3y0449fl9y5pfdj7vz4rkmkl2', [{ denom: LumConstants.MicroLumDenom, amount: '1000000000' }]);
    //
    //     const fee = {
    //         amount: [{ denom: LumConstants.MicroLumDenom, amount: '1000000' }],
    //         gas: '500000',
    //     };
    // }
}
