export const validatorsSeed = [
    {
        proposer_address: '4F18ED31F8C88ECFFD6CF6E72F56D6C28683B9E7',
        consensus_address: 'lumvalcons1fuvw6v0cez8vlltv7mnj74kkc2rg8w08zngrer',
        consensus_pubkey: 'lumvalconspub1cg2lmmjg7cjkltyaz94y24eyca3hvmdutrhdhg6esfn8c8xspx3sk9vdy9',
        operator_address: 'lumvaloper1yhaswwgg5tz7veknxwaj8vc8rfa9s0nagpmn2t',
        account_address: 'lum1yhaswwgg5tz7veknxwaj8vc8rfa9s0nahkjq30',
        description: {
            moniker: 'Klub Staking',
            identity: 'CF0852DD298E2B0D',
            website: 'https://klub.ki/staking',
            security_contact: '',
            details: 'Highly secure and resilient infrastructure for Lum Network. Powered by Klub.',
        },
        displayed_name: 'Klub Staking',
        jailed: false,
        status: 3,
        tokens: 271279901885886,
        delegator_shares: 271279901885886,
        commission: {
            rates: {
                current_rate: 0.05,
                max_rate: 0.1,
                max_change_rate: 0.01,
            },
            last_updated_at: new Date('2021-12-14T17:00:00.000Z'),
        },
        bonded_height: 0,
        self_bonded: 1000000000000,
        tombstoned: false,
        uptime: 100,
    },
    {
        proposer_address: '7378B8182CBC5E00616B205EAA278CCDBF2307C7',
        consensus_address: 'lumvalcons1wdutsxpvh30qqcttyp025fuvekljxp7866a5cg',
        consensus_pubkey: 'lumvalconspub17fr3ssxg0q0kxxk2g3krfdy3wnnxmqs25wpxrn8njpcteqh456kqf80usr',
        operator_address: 'lumvaloper1qx2dts3tglxcu0jh47k7ghstsn4nactufgmmlk',
        account_address: 'lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj',
        description: {
            moniker: 'Lum Foundation',
            identity: '',
            website: '',
            security_contact: '',
            details: 'Lum Foundation operated validator',
        },
        displayed_name: 'Lum Foundation',
        jailed: false,
        status: 3,
        tokens: 158195568439202,
        delegator_shares: 158195568439202,
        commission: {
            rates: {
                current_rate: 1,
                max_rate: 1,
                max_change_rate: 0.01,
            },
            last_updated_at: new Date('2021-12-14T17:00:00.000Z'),
        },
        bonded_height: 0,
        self_bonded: 61000000000000,
        tombstoned: false,
        uptime: 99.87,
    },
];

export const klubStakingDelegation = {
    delegatorAddress: 'lum1la54t6rupy0v3ns0v05e8rd8zvre8m4xkkugvs',
    validatorAddress: 'lumvaloper1yhaswwgg5tz7veknxwaj8vc8rfa9s0nagpmn2t',
    shares: 500000,
    balances: { denom: 'ulum', amount: 800000 },
};

export const lumFoundationDelegation = {
    delegatorAddress: 'lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj',
    validatorAddress: 'lumvaloper1qx2dts3tglxcu0jh47k7ghstsn4nactufgmmlk',
    shares: 61000000000000,
    balances: { denom: 'ulum', amount: 61000000000000 },
};
