export const depositSeed = {
    proposalId: 1,
    depositorAddress: 'lumvaloper1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sjr9zvg',
    amount: { denom: 'ulum', amount: '100000000000' },
};

export const voteSeed = {
    proposalId: 1,
    voterAddress: 'lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn',
    voteOption: 2,
    voteWeight: '1000000000000000000',
};

export const govPropSeed = {
    id: 1,
    type_url: 'lum.network.dfract.WithdrawAndMintProposal',
    status: 3,
    total_deposits: [{ denom: 'ulum', amount: 100000000000 }],
    metadata: '',
    final_tally_result: { no: 0, yes: 1366533125861608, abstain: 1095104169, no_with_veto: 2873511160 },
    content:
        '{"title": "DFract Allocation #18", "description": "\\nDFract Allocation #18\\n\\nGovernance proposal for the DFract protocol on the Lum Network (dfract.fi).\\n\\nThis proposal is required in order to use the funds available in the DFract module account (at the time the proposal passes) in order to buy the designated assets on Osmosis and delegate them on their native blockchain.\\n\\nThe list of assets alongside the repartition of the funds is available on the official DFract website (dfract.fi).\\n\\nThis proposal will set the new DFR mint rate to 1.073693 since the protocol treasury underlying value changed by about +4.96% since the previous proposal.\\n\\nStakers must:\\n- Vote YES to use the funds from the DFract module account vault and increase DFract protocol value\\n- Vote NO to reject this proposal and let the funds in the DFract module account vault\\n\\n", "microMintRate": {"low": 1073693, "high": 0, "unsigned": false}, "withdrawalAddress": "lum1euhszjasgkeskujz6zr42r3lsxv58mfgsmlps0"}',
    submitted_at: new Date('2023-02-10 10:33:42.017'),
    deposit_end_time: new Date('2023-02-13 10:33:42.017'),
    voting_start_time: new Date('2023-02-10 10:34:34.281'),
    voting_end_time: new Date('2023-02-13 10:34:34.281'),
    created_at: new Date('2023-02-16 12:32:00.938'),
    updated_at: null,
};
