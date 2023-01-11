export const seedTransaction = [
    {
        hash: 'D0DA7F9B835F71A37D083C495C5F9505F0F1D84669F3F8B829E0CEF811F9000A',
        height: 5364528,
        time: new Date('2022-12-21T12:32:20.055Z'),
        proposer_address: 'F0DC79EBFC541AD2D19ED865515EE85F7D502A56',
        operator_address: 'lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh',
        success: true,
        code: 0,
        fees: [{ denom: 'ulum', amount: 100 }],
        addresses: [],
        gas_wanted: 83436,
        gas_used: 81491,
        memo: '',
        messages: [
            {
                value: {
                    id: 'a57771b4550905c64de3',
                    data: { productsReviews: [] },
                    amount: { denom: 'ulm', amount: '0' },
                    schema: 'lum-network/review',
                    secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    claimAddress: '',
                    closesAtBlock: 12150,
                    creatorAddress: 'lum1uc4vr6y258uhwexk4junvxn6mxx7rayvek3yvz',
                    claimExpiresAtBlock: 12150,
                },
                type_url: '/lum.network.beam.MsgOpenBeam',
            },
        ],
        message_type: '/lum.network.beam.MsgOpenBeam',
        messages_count: 1,
        raw_logs: [{ msg_index: 0, log: '', events: [{ type: 'message', attributes: [{ key: 'action', value: 'OpenBeam' }] }] }],
        raw_events: [
            {
                type: 'coin_spent',
                attributes: [
                    { key: '7370656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                    { key: '616D6F756E74', value: '313030756C756D' },
                ],
            },
            {
                type: 'coin_received',
                attributes: [
                    { key: '7265636569766572', value: '6C756D313778706676616B6D32616D67393632796C73366638347A336B656C6C3863356C396E37663766' },
                    { key: '616D6F756E74', value: '313030756C756D' },
                ],
            },
            {
                type: 'transfer',
                attributes: [
                    { key: '726563697069656E74', value: '6C756D313778706676616B6D32616D67393632796C73366638347A336B656C6C3863356C396E37663766' },
                    { key: '73656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                    { key: '616D6F756E74', value: '313030756C756D' },
                ],
            },
            { type: 'message', attributes: [{ key: '73656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' }] },
            {
                type: 'tx',
                attributes: [
                    { key: '666565', value: '313030756C756D' },
                    { key: '6665655F7061796572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                ],
            },
            { type: 'tx', attributes: [{ key: '6163635F736571', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A2F32' }] },
            {
                type: 'tx',
                attributes: [
                    {
                        key: '7369676E6174757265',
                        value: '7A555439652B58746D41327A47517654654D6A47327862724551557837336E564D77497838315878374734514F5637382F6F446A2B6E6434684630676B375234712B57587132646D4A713037683932704D7A362B46513D3D',
                    },
                ],
            },
            { type: 'message', attributes: [{ key: '616374696F6E', value: '4F70656E4265616D' }] },
        ],
        raw_tx: `{
            tx: '0ACF010ACC010A1D2F6C756D2E6E6574776F726B2E6265616D2E4D73674F70656E4265616D12AA010A146135373737316234353530393035633634646533122A6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A1A406435373530366338366338633861613131316331396431663433616635663563346461316166646130383766653233343733383535383063316632333330623122080A03756C6D1201302A126C756D2D6E6574776F726B2F726576696577320040F65E48F65E12650A500A460A1F2F636F736D6F732E63727970746F2E736563703235366B312E5075624B657912230A2102C0F9E7BE08A521550AE01A8A1418BCE5A5B2CCB5AD19809703F27D0E8FC7A80D12040A020801180212110A0B0A04756C756D1203313030109899051A40CD44FD7BE5ED980DB3190BD378C8C6DB16EB110531EF79D5330231F355F1EC6E10395EFCFE80E3FA7778845D2093B478ABE597AB676626AD3B87DDA9333EBE15',
            result: {
                code: 0,
                codeSpace: '',
                log: '[{"msg_index":0,"events":[{"type":"message","attributes":[{"key":"action","value":"OpenBeam"}]}]}]',
                events: [
                    {
                        type: 'coin_spent',
                        attributes: [
                            { key: '7370656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                            { key: '616D6F756E74', value: '313030756C756D' },
                        ],
                    },
                    {
                        type: 'coin_received',
                        attributes: [
                            { key: '7265636569766572', value: '6C756D313778706676616B6D32616D67393632796C73366638347A336B656C6C3863356C396E37663766' },
                            { key: '616D6F756E74', value: '313030756C756D' },
                        ],
                    },
                    {
                        type: 'transfer',
                        attributes: [
                            { key: '726563697069656E74', value: '6C756D313778706676616B6D32616D67393632796C73366638347A336B656C6C3863356C396E37663766' },
                            { key: '73656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                            { key: '616D6F756E74', value: '313030756C756D' },
                        ],
                    },
                    { type: 'message', attributes: [{ key: '73656E646572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' }] },
                    {
                        type: 'tx',
                        attributes: [
                            { key: '666565', value: '313030756C756D' },
                            { key: '6665655F7061796572', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A' },
                        ],
                    },
                    { type: 'tx', attributes: [{ key: '6163635F736571', value: '6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A2F32' }] },
                    {
                        type: 'tx',
                        attributes: [
                            {
                                key: '7369676E6174757265',
                                value: '7A555439652B58746D41327A47517654654D6A47327862724551557837336E564D77497838315878374734514F5637382F6F446A2B6E6434684630676B375234712B57587132646D4A713037683932704D7A362B46513D3D',
                            },
                        ],
                    },
                    { type: 'message', attributes: [{ key: '616374696F6E', value: '4F70656E4265616D' }] },
                ],
                gasWanted: 85144,
                gasUsed: 83199,
            },
            height: 169,
            index: 0,
            hash: '8FED966C335D80ED96F7AC578D684F46740BAC68C08A494812AC0517C2E4A276',
        }`,
        raw_tx_data: `{
            signatures: ['CD44FD7BE5ED980DB3190BD378C8C6DB16EB110531EF79D5330231F355F1EC6E10395EFCFE80E3FA7778845D2093B478ABE597AB676626AD3B87DDA9333EBE15'],
            body: {
                memo: '',
                timeoutHeight: { low: 0, high: 0, unsigned: true },
                messages: [
                    {
                        typeUrl: '/lum.network.beam.MsgOpenBeam',
                        value: '0A146135373737316234353530393035633634646533122A6C756D317563347672367932353875687765786B346A756E76786E366D78783772617976656B3379767A1A406435373530366338366338633861613131316331396431663433616635663563346461316166646130383766653233343733383535383063316632333330623122080A03756C6D1201302A126C756D2D6E6574776F726B2F726576696577320040F65E48F65E',
                    },
                ],
                extensionOptions: [],
                nonCriticalExtensionOptions: [],
            },
            authInfo: {
                signerInfos: [
                    {
                        sequence: { low: 2, high: 0, unsigned: true },
                        publicKey: { typeUrl: '/cosmos.crypto.secp256k1.PubKey', value: '0A2102C0F9E7BE08A521550AE01A8A1418BCE5A5B2CCB5AD19809703F27D0E8FC7A80D' },
                        modeInfo: { single: { mode: 1 } },
                    },
                ],
                fee: { gasLimit: { low: 85144, high: 0, unsigned: true }, payer: '', granter: '', amount: [{ denom: 'ulum', amount: '100' }] },
            },
        }`,
    },
];
