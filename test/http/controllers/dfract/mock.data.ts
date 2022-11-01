export const mockResponseLatestMetrics = {
    result: [
        {
            symbol: 'atom',
            apy: 0.199565,
            last_updated_at: '2022-10-25T11:00:31.233Z',
            supply: 292586163,
            total_value_usd: 4136480000,
            unit_price_usd: 11.603241787030745,
        },
    ],
    metadata: {
        page: 0,
        limit: 100,
        items_count: 1,
        items_total: 1,
        pages_total: 1,
        has_previous_page: false,
        has_next_page: false,
    },
    code: 200,
    message: '',
};

export const mockResponseHistoricalMetrics = {
    result: [
        {
            id: 'atom_apy',
            extra: [
                {
                    apy: 0.189565,
                    last_updated_at: '2022-10-01T11:00:31.233Z',
                },
                {
                    apy: 0.199565,
                    last_updated_at: '2022-10-25T11:00:31.233Z',
                },
            ],
        },
    ],
    metadata: {
        page: 0,
        limit: 100,
        items_count: 1,
        items_total: 1,
        pages_total: 1,
        has_previous_page: false,
        has_next_page: false,
    },
    code: 200,
    message: '',
};
