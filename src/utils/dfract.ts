import { LumClient } from '@app/services/chains/generic.chain';
import { PageRequest } from '@lum-network/sdk-javascript/build/codegen/helpers';

// Helper function to return apy percentage
export const apy = (inflation: number, communityTaxRate: number, stakingRatio: number) => (inflation * (1 - communityTaxRate)) / stakingRatio;

// Helper function to compute total token amount from chains where we can get the info
export const computeTotalTokenAmount = async (getDecodedAddress: string, client: LumClient, denom: string, applyTenExponentSix: number): Promise<number> => {
    const page: Uint8Array | undefined = null;

    const [balance, rewards, delegationResponses, unbondingResponses] = await Promise.all([
        client.cosmos.bank.v1beta1.balance({ address: getDecodedAddress, denom }),
        client.cosmos.distribution.v1beta1.delegationTotalRewards({ delegatorAddress: getDecodedAddress }),
        client.cosmos.staking.v1beta1.delegatorDelegations({ delegatorAddr: getDecodedAddress, pagination: page ? ({ key: page } as PageRequest) : undefined }),
        client.cosmos.staking.v1beta1.delegatorUnbondingDelegations({ delegatorAddr: getDecodedAddress, pagination: page ? ({ key: page } as PageRequest) : undefined }),
    ]);

    // Available tokens in the address balance
    const accountBalance = Number(balance.balance.amount) || 0;

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
export const computeTotalApy = async (client: LumClient, supply: number, inflation: number, applyTenExponentSix: number): Promise<{ stakingRatio: number; inflation: number; communityTaxRate: number }> => {
    // The total apy is computed based on the following information:
    // 1) The inflation rate which is dependent on the bonding ration and supply
    // 2) The stakingRatio ratio
    // 3) The community tax rate

    const bonding = Number((await client.cosmos.staking.v1beta1.pool()).pool.bondedTokens) / applyTenExponentSix;

    // The staking ratio represents the bonded token divided by the supply
    const stakingRatio = Number(bonding) / Number(supply);

    // CommunityTax is a value set in genesis for each Cosmos network and defined as a percentage that is applied to the fees collected in each block
    const communityTaxRate = Number((await client.cosmos.distribution.v1beta1.params()).params.communityTax);

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

export const getUniqueSymbols = (data: any[]) => {
    const uniqueSymbols = new Set();
    const result = [];
    for (const entry of data) {
        if (!uniqueSymbols.has(entry.symbol)) {
            uniqueSymbols.add(entry.symbol);
            result.push({ symbol: entry.symbol, ...entry });
        }
    }
    return result;
};

export const hasFalsyProperties = (arr: any[]) => {
    return arr.some((obj) => {
        for (const prop in obj) {
            if (!obj[prop]) {
                return true;
            }
        }
        return false;
    });
};

export const getUniqueEntries = (data: any[]) => {
    const uniqueEntries = new Map();
    for (const entry of data) {
        if (!uniqueEntries.has(entry.key)) {
            uniqueEntries.set(entry.key, entry);
        }
    }
    return Array.from(uniqueEntries.values());
};
