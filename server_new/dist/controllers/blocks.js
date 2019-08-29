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
const block_1 = require("../models/block");
const http_1 = require("../utils/http");
const transaction_1 = require("../models/transaction");
exports.BlocksIndexRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const blocks = yield block_1.default.findAll({
        limit: 50,
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });
    return http_1.response(handler, blocks, "", 200);
});
exports.BlocksLatestRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const block = yield block_1.default.findOne({
        order: [['height', 'DESC']],
        attributes: {
            exclude: ['raw']
        }
    });
    if (block === null) {
        return http_1.response(handler, {}, "No latest block found", 404);
    }
    return http_1.response(handler, block, "", 200);
});
exports.BlockHeightRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const block = yield block_1.default.findOne({
        where: {
            height: req.params.height
        },
        attributes: {
            exclude: ['raw']
        },
        include: [transaction_1.default]
    });
    if (!block) {
        return http_1.response(handler, {}, `No block found with the height ${req.params.height}`, 404);
    }
    return http_1.response(handler, block, "", 200);
});
//# sourceMappingURL=blocks.js.map