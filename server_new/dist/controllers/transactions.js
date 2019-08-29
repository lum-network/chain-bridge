"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("../utils/http");
const transaction_1 = require("../models/transaction");
exports.TransactionsIndexRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const transactions = yield transaction_1.default.findAll({
        limit: 50,
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });
    return http_1.response(handler, transactions, "", 200);
});
exports.TransactionHashRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const transaction = yield transaction_1.default.findOne({
        where: {
            hash: req.params.hash.toUpperCase()
        },
        attributes: {
            exclude: ['raw']
        }
    });
    if (transaction === null) {
        return http_1.response(handler, {}, `No transaction found with the hash ${req.params.hash}`, 404);
    }
    return http_1.response(handler, transaction, "", 200);
});
//# sourceMappingURL=transactions.js.map