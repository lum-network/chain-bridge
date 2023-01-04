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
        proposer_address: 'F0DC79EBFC541AD2D19ED865515EE85F7D502A56',
        consensus_address: 'lumvalcons17rw8n6lu2sdd95v7mpj4zhhgta74q2jkmchpel',
        consensus_pubkey: 'lumvalconspub1hfujfs5huxmj04c7h0qzthlyun5n57j2sc6yz6uxcgvxsul5cc9qpwp8w5',
        operator_address: 'lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh',
        account_address: 'lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn',
        description: {
            moniker: 'Lum Network Testnet Foundation',
            identity: '',
            website: '',
            security_contact: '',
            details: 'Lum Network Testnet Foundation operated validator',
        },
        displayed_name: 'Lum Network Testnet Foundation',
        jailed: false,
        status: 3,
        tokens: 50500001000000,
        delegator_shares: 50500001000000,
        commission: { rates: { max_rate: 0.2, current_rate: 0.01, max_change_rate: 0.01 }, last_updated_at: new Date('2022-02-04T14:28:30.457Z') },
        bonded_height: 0,
        self_bonded: 50000001000000,
        tombstoned: false,
        uptime: 100,
    },
];

export const klubStakingDelegation = {
    delegatorAddress: 'lum1la54t6rupy0v3ns0v05e8rd8zvre8m4xkkugvs',
    validatorAddress: 'lumvaloper1yhaswwgg5tz7veknxwaj8vc8rfa9s0nagpmn2t',
    shares: 500000,
    balances: { denom: 'ulum', amount: 800000 },
};

export const lumFoundationDelegation = {
    delegatorAddress: 'lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn',
    validatorAddress: 'lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh',
    shares: 61000000000000,
    balances: { denom: 'ulum', amount: 61000000000000 },
};

export const blockSeed1 = {
    hash: 'BDF77AAB49B4B4FC88517570F11ED483CFDDD80F727789A02DB66F1020E235B9',
    height: 5364528,
    time: new Date('2022-12-20T19:09:36.513Z'),
    tx_count: 0,
    tx_hashes: ['D0DA7F9B835F71A37D083C495C5F9505F0F1D84669F3F8B829E0CEF811F9000A'],
    proposer_address: 'F0DC79EBFC541AD2D19ED865515EE85F7D502A56',
    operator_address: 'lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh',
    raw_block:
        '{"blockId":{"hash":"B19ED16EB0E726A3E552D46D4037083686646AF6D7757EE8AEDAD74C33E338AB","parts":{"total":1,"hash":"248C3B119EF1FCA6F89E01A6E4FF9904A65EB7EFE4CDCD24C6B96B224A259A5B"}},"block":{"header":{"version":{"block":11,"app":0},"chainId":"lum-network-1","height":5364436,"time":"2022-12-20T19:09:48.272Z","lastBlockId":{"hash":"F4DF106C236E0E7F83CB8FCD7E7F992BAEFF1F63A00CB3253394FAEA54DF88FF","parts":{"total":1,"hash":"60A63103DCD485BCBF418FD41A67470005C0ADE005F3BEE2ED014EA9B863154C"}},"lastCommitHash":"7950D39FB2E01BC1D5E75A9B8C16C80816A77FDC35B5E3F0F6B96C0CD1ED5F4A","dataHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","validatorsHash":"9CAC45480AA95742828BEEB3343287BDF86666EB3A2ADF9068DA8BFB35499549","nextValidatorsHash":"9CAC45480AA95742828BEEB3343287BDF86666EB3A2ADF9068DA8BFB35499549","consensusHash":"048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F","appHash":"9263B25A5092A41BF2C5E85C38225E4F66B4C3719244D8E93A8EDADB9F62506F","lastResultsHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","evidenceHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","proposerAddress":"7628FD046568EC599B164B5CE2858AD058D97B3B"},"lastCommit":{"blockId":{"hash":"F4DF106C236E0E7F83CB8FCD7E7F992BAEFF1F63A00CB3253394FAEA54DF88FF","parts":{"total":1,"hash":"60A63103DCD485BCBF418FD41A67470005C0ADE005F3BEE2ED014EA9B863154C"}},"height":5364435,"round":0,"signatures":[{"blockIdFlag":2,"validatorAddress":"4F18ED31F8C88ECFFD6CF6E72F56D6C28683B9E7","timestamp":"2022-12-20T19:09:48.256Z","signature":"BE5B61E42CB4FF08137A1F4EC60C6550DEC8896743D2FB75F46028B7455D56E4A0A1B1FA380CF059098704695A769B49AB1197CB0A5E08E6F0895A6EC8588508"}]},"txs":[],"evidence":[]}}',
    updated_at: new Date('2022-12-20'),
    created_at: new Date('2022-12-20'),
    nonce: 1,
};

export const blockSeed2 = {
    hash: 'CDF77AAB49B4B4FC88517570F11ED483CFDDD80F727789A02DB66F1020E235C9',
    height: 5364527,
    time: new Date('2022-12-20T19:09:29.513Z'),
    tx_count: 0,
    tx_hashes: [],
    proposer_address: 'F0DC79EBFC541AD2D19ED865515EE85F7D502A56',
    operator_address: 'lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh',
    raw_block:
        '{"blockId":{"hash":"CDF77AAB49B4B4FC88517570F11ED483CFDDD80F727789A02DB66F1020E235C9","parts":{"total":1,"hash":"248C3B119EF1FCA6F89E01A6E4FF9904A65EB7EFE4CDCD24C6B96B224A259A5B"}},"block":{"header":{"version":{"block":11,"app":0},"chainId":"lum-network-1","height":5364436,"time":"2022-12-20T19:09:48.272Z","lastBlockId":{"hash":"F4DF106C236E0E7F83CB8FCD7E7F992BAEFF1F63A00CB3253394FAEA54DF88FF","parts":{"total":1,"hash":"60A63103DCD485BCBF418FD41A67470005C0ADE005F3BEE2ED014EA9B863154C"}},"lastCommitHash":"7950D39FB2E01BC1D5E75A9B8C16C80816A77FDC35B5E3F0F6B96C0CD1ED5F4A","dataHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","validatorsHash":"9CAC45480AA95742828BEEB3343287BDF86666EB3A2ADF9068DA8BFB35499549","nextValidatorsHash":"9CAC45480AA95742828BEEB3343287BDF86666EB3A2ADF9068DA8BFB35499549","consensusHash":"048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F","appHash":"9263B25A5092A41BF2C5E85C38225E4F66B4C3719244D8E93A8EDADB9F62506F","lastResultsHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","evidenceHash":"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855","proposerAddress":"7628FD046568EC599B164B5CE2858AD058D97B3B"},"lastCommit":{"blockId":{"hash":"F4DF106C236E0E7F83CB8FCD7E7F992BAEFF1F63A00CB3253394FAEA54DF88FF","parts":{"total":1,"hash":"60A63103DCD485BCBF418FD41A67470005C0ADE005F3BEE2ED014EA9B863154C"}},"height":5364435,"round":0,"signatures":[{"blockIdFlag":2,"validatorAddress":"4F18ED31F8C88ECFFD6CF6E72F56D6C28683B9E7","timestamp":"2022-12-20T19:09:48.256Z","signature":"BE5B61E42CB4FF08137A1F4EC60C6550DEC8896743D2FB75F46028B7455D56E4A0A1B1FA380CF059098704695A769B49AB1197CB0A5E08E6F0895A6EC8588508"}]},"txs":[],"evidence":[]}}',
    updated_at: new Date('2022-12-20'),
    created_at: new Date('2022-12-20'),
    nonce: 1,
};
