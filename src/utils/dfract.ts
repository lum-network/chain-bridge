import { LumClient } from '@lum-network/sdk-javascript';

// Helper function to return apy percentage
export const apy = (inflation: number, communityTaxRate: number, stakingRatio: number) => (inflation * (1 - communityTaxRate)) / stakingRatio;

// Helper function to compute total token amount from chains where we can get the info
export const computeTotalTokenAmount = async (getDecodedAddress: string, client: LumClient, denom: string, applyClientPrecision: number, applyTenExponentSix: number): Promise<number> => {
    const page: Uint8Array | undefined = undefined;

    // The total token amount is composed of:
    // 1) available tokens in balance
    // 2) staking rewards tokens
    // 3) staking rewards tokens
    // 4) delagation rewards tokens
    // 5) unbounding delegation

    const [balance, rewards, delegationResponses, unbondingResponses] = await Promise.all([
        client.getBalance(getDecodedAddress, denom),
        client.queryClient.distribution.delegationTotalRewards(getDecodedAddress),
        client.queryClient.staking.delegatorDelegations(getDecodedAddress, page),
        client.queryClient.staking.delegatorUnbondingDelegations(getDecodedAddress, page),
    ]);

    // 1) We get the available balance on the asset account

    const getAvailableBalance = Number(balance.amount) || 0;

    // 2) We get the nb of tokens coming from the staking rewards
    // For each chain we compute the lum address to the equivalent of other chains address denom and can retrieve the token repartition
    const getStakingRewards = Number(rewards.rewards.map((el) => el.reward.filter((el) => el.denom === denom))[0].map((el) => el.amount)) / applyClientPrecision;

    // 3) We get the nb of tokens coming from the delegation rewards.
    // From that we extract the amount
    const getDelegationReward = delegationResponses.delegationResponses.map((el) => Number(el.balance.amount));

    // 4) We get the nb of tokens coming from the unbounding delation
    const getUnbondingDelegation = unbondingResponses.unbondingResponses.map((el) => el.entries.map((el) => el.balance || 0));

    // 5) The total token is computed from the sum of the 4 previous elements divided by 10^6
    const totalToken = (Number(getStakingRewards) + Number(getUnbondingDelegation) + Number(getAvailableBalance) + Number(getDelegationReward)) / applyTenExponentSix;

    return totalToken;
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

export interface GenericValueEntity {
    last_updated_at?: Date;
    apy?: number;
    supply?: number;
    total_value_usd?: number;
    unit_price_usd?: number;
    total_allocated_token?: number;
    account_balance?: number;
    tvl?: number;
}

// Eliminate falsy values to be inserted in DB
export const filterFalsy = (obj) =>
    Object.keys(obj).reduce((acc, key) => {
        if (obj[key]) {
            acc[key] = obj[key];
        }

        return acc;
    }, []);
