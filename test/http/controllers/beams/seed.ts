export const beamSeed1 = {
    id: '00221810-9f4a-4fe8-8499-8590461fc169',
    creator_address: 'lum14vu2tyqt5jugrxup756w72fc83mug4akv6s6qr',
    status: 1,
    claim_address: '',
    funds_withdrawn: false,
    claimed: false,
    cancel_reason: '',
    hide_content: false,
    schema: 'lum-network/review',
    claim_expires_at_block: 5564527,
    closes_at_block: 5564527,
    amount: {
        denom: 'ulum',
        amount: 2012526642,
    },
    data: {
        reward: {
            amount: 2,
            status: 'pending',
            details: [
                {
                    type: 'overall',
                    amount: 2,
                    status: 'pending',
                    maxAmount: 0,
                },
            ],
            trigger: 'review',
            currency: 'EUR',
            maxAmount: 3,
        },
        productsReviews: [
            {
                title: 'Paradisio+-+Friandise+Os+Fum%C3%A9+pour+Chien',
                medias: [],
                content: {
                    cons: '',
                    pros: '',
                    overall: '26ae999a955db22332250c94c9b34318',
                },
                orderId: 'cbd22b28-bd6d-4116-a3c8-680b098c397c',
                ratings: {
                    overall: 4,
                    quality: 0,
                },
                products: [
                    {
                        ids: {
                            mpns: [],
                            skus: [],
                            asins: [],
                            gtins: [],
                        },
                        url: '',
                        name: '',
                        urls: [],
                    },
                ],
                reviewId: 'cbd22b28-bd6d-4116-a3c8-680b098c397c:5b6e0d6c-0389-44db-83a6-319230815be7',
                ratingUrl: '',
                reviewUrl: '',
                timestamp: '2022-07-13 13:40:22',
                collectionMethod: 'after_fulfillment',
            },
        ],
    },
    dispatched_at: new Date('2022-07-13 10:47:34.085'),
    closed_at: new Date('2022-07-27 13:13:32.181'),
    created_at: new Date('2022-11-04 17:00:44.743'),
    updated_at: null,
    nonce: 0,
};

export const beamSeed2 = {
    id: '00ae0884-bfd6-4c96-afc1-14355ebbced8',
    creator_address: 'lum14vu2tyqt5jugrxup756w72fc83mug4akv6s6qr',
    status: 1,
    claim_address: '',
    funds_withdrawn: false,
    claimed: false,
    cancel_reason: '',
    hide_content: false,
    schema: 'lum-network/review',
    claim_expires_at_block: 5564527,
    closes_at_block: 5564527,
    amount: {
        denom: 'ulum',
        amount: 1758738553,
    },
    data: {
        reward: {
            amount: 2,
            status: 'pending',
            details: [
                {
                    type: 'overall',
                    amount: 2,
                    status: 'pending',
                    maxAmount: 0,
                },
            ],
            trigger: 'review',
            currency: 'EUR',
            maxAmount: 3,
        },
        productsReviews: [
            {
                title: 'Nutrivia+-+Os+%C3%A0+M%C3%A2cher+pour+Chien+de+Petite+Taille+-+4x45g',
                medias: [],
                content: {
                    cons: '',
                    pros: '',
                    overall: 'e270c206853160fb18407be89685709e',
                },
                orderId: '8673e144-96b4-4de9-acfc-dfc797831fc5',
                ratings: {
                    overall: 4,
                    quality: 0,
                },
                products: [
                    {
                        ids: {
                            mpns: [],
                            skus: [],
                            asins: [],
                            gtins: [],
                        },
                        url: '',
                        name: '',
                        urls: [],
                    },
                ],
                reviewId: '8673e144-96b4-4de9-acfc-dfc797831fc5:5fbf49c4-db09-45e5-baf7-836d17698c6a',
                ratingUrl: '',
                reviewUrl: '',
                timestamp: '2022-07-17 10:38:20',
                collectionMethod: 'after_fulfillment',
            },
        ],
    },
    dispatched_at: new Date('2022-07-17 07:42:25.678'),
    closed_at: new Date('2022-07-31 10:24:46.286'),
    created_at: new Date('2022-11-04 17:42:11.343'),
    updated_at: null,
    nonce: 0,
};

export const beamEvent1 = {
    time: new Date('2022-11-04 17:00:44.743'),
    type: '/lum.network.beam.MsgOpenBeam',
    value: {
        ...beamSeed1,
        amount: {
            denom: 'ulum',
            amount: '2012526642',
        },
    },
};

export const beamEvent2 = {
    time: new Date('2022-11-04 17:42:11.343'),
    type: '/lum.network.beam.MsgOpenBeam',
    value: {
        ...beamSeed2,
        amount: {
            denom: 'ulum',
            amount: '1758738553',
        },
    },
};
