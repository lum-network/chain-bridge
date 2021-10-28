import { Proposal } from '@lum-network/sdk-javascript/build/codec/cosmos/gov/v1beta1/gov';
import { LumRegistry } from '@lum-network/sdk-javascript';

export const decodeContent = (proposal: Proposal): Proposal => {
    const newProposal = proposal;

    newProposal.content = LumRegistry.decode(proposal.content);

    return newProposal;
};
