import { Proposal } from '@lum-network/sdk-javascript/build/codegen/cosmos/gov/v1/gov';

// We keep this function to assure backward compatibility
export const decodeContent = (proposal: Proposal): Proposal => {
    return proposal;
};
