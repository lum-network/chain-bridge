"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blocks_1 = require("../controllers/blocks");
const transactions_1 = require("../controllers/transactions");
const accounts_1 = require("../controllers/accounts");
const validators_1 = require("../controllers/validators");
const core_1 = require("../controllers/core");
const migrations_1 = require("../controllers/migrations");
const routes = [
    { method: 'GET', path: '/blocks', handler: blocks_1.BlocksIndexRoute },
    { method: 'GET', path: '/blocks/latest', handler: blocks_1.BlocksLatestRoute },
    { method: 'GET', path: '/blocks/{height}', handler: blocks_1.BlockHeightRoute },
    { method: 'GET', path: '/transactions', handler: transactions_1.TransactionsIndexRoute },
    { method: 'GET', path: '/transactions/{hash}', handler: transactions_1.TransactionHashRoute },
    { method: 'GET', path: '/accounts/{address}', handler: accounts_1.AccountAddressRoute },
    { method: 'GET', path: '/validators', handler: validators_1.ValidatorsIndexRoute },
    { method: 'GET', path: '/validators/{address}', handler: validators_1.ValidatorAddressRoute },
    { method: 'POST', path: '/search', handler: core_1.SearchRoute },
    { method: 'GET', path: '/migration/{reference}', handler: migrations_1.MigrationShowRoute },
    { method: 'POST', path: '/migration', handler: migrations_1.MigrationStoreRoute }
];
exports.default = routes;
//# sourceMappingURL=index.js.map