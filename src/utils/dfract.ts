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
        await client.getBalance(getDecodedAddress, denom),
        await client.queryClient.distribution.delegationTotalRewards(getDecodedAddress),
        await client.queryClient.staking.delegatorDelegations(getDecodedAddress, page),
        await client.queryClient.staking.delegatorUnbondingDelegations(getDecodedAddress, page),
    ]);

    const getAvailableBalance = Number(balance.amount) || 0;

    const getStakingRewards = Number(rewards.rewards.map((el) => el.reward.filter((el) => el.denom === denom))[0].map((el) => el.amount)) / applyClientPrecision;

    const getDelegationReward = delegationResponses.delegationResponses.map((el) => Number(el.balance.amount));

    const getUnbondingDelegation = unbondingResponses.unbondingResponses.map((el) => el.entries.map((el) => el.balance || 0));

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

    const stakingRatio = Number(bonding) / Number(supply);

    const communityTaxRate = Number((await client.queryClient.distribution.params()).params.communityTax) / applyClientPrecision;

    return {
        stakingRatio,
        inflation,
        communityTaxRate,
    };
};

export interface GenericValueEntity {
    apy?: number;
    supply?: number;
    total_value_usd?: number;
    unit_price_usd?: number;
}

// Eliminate falsy values to be inserted in DB
export const filterFalsy = (obj) =>
    Object.keys(obj).reduce((acc, key) => {
        if (obj[key]) {
            acc[key] = obj[key];
        }

        return acc;
    }, []);
