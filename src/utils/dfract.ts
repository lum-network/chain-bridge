import { LumClient } from '@lum-network/sdk-javascript';

// Helper function to return apy percentage
export const apy = (inflation: number, communityTaxRate: number, stakingRatio: number) => (inflation * (1 - communityTaxRate)) / stakingRatio;

// Helper function to compute total token amount from chains where we can get the info
export const computeTotalTokenAmount = async (getDecodedAddress: string, client: LumClient, denom: string, applyClientPrecision: number, applyTenExponentSix: number): Promise<number> => {
    const page: Uint8Array | undefined = null;

    const [balance, rewards, delegationResponses, unbondingResponses] = await Promise.all([
        client.getBalance(getDecodedAddress, denom),
        client.queryClient.distribution.delegationTotalRewards(getDecodedAddress),
        client.queryClient.staking.delegatorDelegations(getDecodedAddress, page),
        client.queryClient.staking.delegatorUnbondingDelegations(getDecodedAddress, page),
    ]);

    // Available tokens in the address balance
    const accountBalance = Number(balance.amount) || 0;

    // Tokens in the address rewards balance
    const byDenomStakingRewards = rewards.rewards.map((el) => el.reward.filter((el) => el.denom === denom));
    let stakingRewards = 0;
    if (byDenomStakingRewards.length > 0) {
        stakingRewards = byDenomStakingRewards[0].map((el) => el.amount).reduce((a, b) => Number(a) + Number(b), 0);
    }

    // Tokens in the address delegation rewards
    const getDelegationRewards = delegationResponses.delegationResponses.map((el) => el.balance.amount).reduce((a, b) => Number(a) + Number(b), 0);

    // Tokens currently in the address unbonding balance
    const getUnbondingDelegations = unbondingResponses.unbondingResponses.map((el) => el.entries.map((el) => el.balance || 0)).reduce((a, b) => Number(a) + Number(b), 0);

    return (stakingRewards + getUnbondingDelegations + accountBalance + getDelegationRewards) / applyTenExponentSix;
};

// Helper function to compute total apy from chains where we can get the info
export const computeTotalApy = async (
    client: LumClient,
    supply: number,
    inflation: number,
    applyClientPrecision: number,
    applyTenExponentSix: number,
): Promise<{ stakingRatio: number; inflation: number; communityTaxRate: number }> => {
    // The total apy is computed based on the following information:
    // 1) The inflation rate which is dependent on the bonding ration and supply
    // 2) The stakingRatio ratio
    // 3) The community tax rate

    const bonding = Number((await client.queryClient.staking.pool()).pool.bondedTokens) / applyTenExponentSix;

    // The staking ratio represents the bonded token divided by the supply
    const stakingRatio = Number(bonding) / Number(supply);

    // CommunityTax is a value set in genesis for each Cosmos network and defined as a percentage that is applied to the fees collected in each block
    const communityTaxRate = Number((await client.queryClient.distribution.params()).params.communityTax) / applyClientPrecision;

    return {
        stakingRatio,
        inflation,
        communityTaxRate,
    };
};

// Value field can only contain one these keys at the time
export interface GenericAssetInfo {
    symbol?: string;
    unit_price_usd?: number;
    total_value_usd?: number;
    supply?: number;
    apy?: number;
    total_allocated_token?: number;
    tvl?: number;
    last_updated_at?: Date;
}

// Eliminate falsy values to be inserted in DB
export const filterFalsy = (obj) =>
    Object.keys(obj).reduce((acc, key) => {
        if (obj[key]) {
            acc[key] = obj[key];
        }

        return acc;
    }, []);
