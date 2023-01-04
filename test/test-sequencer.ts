// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sequencer = require('@jest/test-sequencer').default;

// This CustomSequencer aims to give a execution order for the e2e tests (controllers)
// In order of execution we justify the following steps as it follows our current procedural sequences
// 1) Check health of server
// 2) We first seed validators as they are responsible for validating blocks and run e2e tests
// 3) We then seed blocks and run e2e tests
// 4) Blocks may contain transactions. We seed and run e2e tests
// 5) Transactions may contains beams. We seed and run e2e tests
// After these steps we check for individual use cases
// 6) Run e2e tests on stats (which are related to beams)
// 7) Run e2e tests on governance
// 8) Run e2e tests on dfract
// 9) Run e2e tests on accounts
// 10) Run e2e tests on core

class CustomSequencer extends Sequencer {
    sort(tests) {
        const testPaths = [
            { path: `${process.cwd()}/test/http/controllers/health/health.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/validators/validators.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/blocks/blocks.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/transactions/transactions.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/beams/beams.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/stats/stats.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/governance/governance.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/dfract/dfract.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/accounts/accounts.e2e-spec.ts` },
            { path: `${process.cwd()}/test/http/controllers/core/core.e2e-spec.ts` },
        ];

        return tests.sort((a, b) => {
            // Find the index of the object in testPaths with the same path as a
            const aIndex = testPaths.findIndex((item) => item.path === a.path);
            // Find the index of the object in testPaths with the same path as b
            const bIndex = testPaths.findIndex((item) => item.path === b.path);
            // Compare the indices and return the appropriate value
            if (aIndex < bIndex) return -1;
            if (aIndex > bIndex) return 1;

            return 0;
        });
    }
}

module.exports = CustomSequencer;
