import { LumClient, LumUtils } from '@lum-network/sdk-javascript';
import { LUM_STAKING_ADDRESS } from './constants';

export const apy = (inflation: number, rateCommunityTax: number, stakingRatio: number) => (inflation * (1 - rateCommunityTax)) / stakingRatio;

export const computeTotalAmount = async (prefix: string, client: LumClient, denom: string, applyClientPrecision: number, applyTenExponentSix: number): Promise<number> => {
    const page: Uint8Array | undefined = undefined;
    const decode = LumUtils.Bech32.decode(LUM_STAKING_ADDRESS);
    const getDecodedAddress = LumUtils.Bech32.encode(prefix, decode.data);

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

export const computeApyMetrics = async (
    client: LumClient,
    supply: number,
    applyClientPrecision: number,
    applyTenExponentSix: number,
): Promise<{ stakingRatio: number; inflation: number; communityTaxRate: number }> => {
    const bonding = Number((await client.queryClient.staking.pool()).pool.bondedTokens) / applyTenExponentSix;
    const stakingRatio = Number(bonding) / Number(supply);

    const inflation = Number(await client.queryClient.mint.inflation()) / applyClientPrecision;

    const communityTaxRate = Number((await client.queryClient.distribution.params()).params.communityTax) / applyClientPrecision;

    return {
        stakingRatio,
        inflation,
        communityTaxRate,
    };
};
