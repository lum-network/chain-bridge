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
const account_1 = require("../models/account");
exports.AccountAddressRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const account = yield account_1.default.findOne({
        where: {
            address: req.params.address
        }
    });
    if (account === null) {
        return http_1.response(handler, {}, `No account found with the address ${req.params.address}`, 404);
    }
    return http_1.response(handler, account, "", 200);
});
//# sourceMappingURL=accounts.js.map