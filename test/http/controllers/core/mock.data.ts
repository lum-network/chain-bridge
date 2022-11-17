export const mockNotifySocketData = {
    channel: 'blocks',
    event: 'new-block',
    data: {
        hash: '39C53FCEFF5CFBD4C740F764720753A1C27EA6C92C91AA2D5F34EB05A9BF0FFE',
        height: 4864005,
        time: '2022-11-16T17:21:33.571Z',
        tx_count: 0,
        tx_hashes: [],
        proposer_address: 'DB0397039F90CC3080C25426A7D937CAC685999D',
        operator_address: 'lumvaloper1up3slj4nr5y23gxkvqn8h5ra9mv0pj2vv70zs4',
        raw_block: { blockId: [Object], block: [Object] },
        updated_at: '2022-11-16',
        created_at: '2022-11-16',
        nonce: 1,
    },
};

export const mockLumPriceResponse = {
    result: {
        denom: 'ibc/8A34AF0C1943FD0DFCDE9ADBF0B2C9959C45E87E6088EA2FC6ADACD59261B8A2',
        liquidity: expect.any(Number),
        name: 'Lum Network',
        previous_day_price: expect.any(Number),
        price: expect.any(Number),
        symbol: 'LUM',
        volume_24h: expect.any(Number),
    },
    code: 200,
    message: '',
};

export const mockAssetResponse = {
    result: [
        {
            denom: 'ibc/05554A9BFDD28894D7F18F4C707AA0930D778751A437A9FE1F4684A3E1199728',
            amount: expect.any(Number),
        },
        {
            denom: 'ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23',
            amount: expect.any(Number),
        },
        {
            denom: 'ibc/6CDA7F7E4DDB86FD275A986E78F13DF2FC500E3FEC2149E2215061FA51BB8C5D',
            amount: expect.any(Number),
        },
        {
            denom: 'ibc/8162B9F421648BAF56D10EE30A2B0950A18C4431858E87D1D02906EDF0574A00',
            amount: expect.any(Number),
        },
        {
            denom: 'udfr',
            amount: expect.any(Number),
        },
        {
            denom: 'ulum',
            amount: expect.any(Number),
        },
    ],
    code: 200,
    message: '',
};

export const mockParamsResponse = {
    result: {
        chain_id: 'lum-network-1',
        mint: {
            denom: 'ulum',
            inflation: {
                rate_change: 0.13,
                max: 0.2,
                min: 0.07,
                current: 0.2,
            },
            goal_bonded: 0.67,
            blocks_per_year: 6311520,
        },
        staking: {
            max_validators: 100,
            max_entries: 7,
            historical_entries: 10000,
            denom: 'ulum',
            unbonding_time: 1814400,
        },
        gov: {
            vote: {
                period: 259200,
            },
            deposit: {
                minimum: [
                    {
                        denom: 'ulum',
                        amount: 100000000000,
                    },
                ],
                period: 259200,
            },
            tally: {
                quorum: '333334303030303030303030303030303030',
                threshold: '353030303030303030303030303030303030',
                veto_threshold: '333334303030303030303030303030303030',
            },
        },
        distribution: {
            community_tax: 0.01,
            base_proposer_reward: 0.01,
            bonus_proposer_reward: 0.04,
            withdraw_address_enabled: true,
            community_pool: [
                {
                    denom: 'ulum',
                    amount: expect.any(Number),
                },
            ],
        },
        slashing: {
            signed_blocks_window: 10000,
            min_signed_per_window: 0.05,
            slash_fraction_double_sign: 0.05,
            slash_fraction_downtime: 0.001,
            downtime_jail_duration: 600,
        },
    },
    code: 200,
    message: '',
};
