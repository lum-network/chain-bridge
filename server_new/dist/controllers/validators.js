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
const client_1 = require("sandblock-chain-sdk-js/dist/client");
exports.ValidatorsIndexRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const sbc = new client_1.default();
    const validators = yield sbc.getValidators();
    return http_1.response(handler, validators.result, "", 200);
});
exports.ValidatorAddressRoute = (req, handler) => __awaiter(this, void 0, void 0, function* () {
    const sbc = new client_1.default();
    const validator = yield sbc.getValidator(req.params.address);
    if (validator === null) {
        return http_1.response(handler, {}, `No validator found with address ${req.params.address}`, 404);
    }
    return http_1.response(handler, validator.result, "", 200);
});
//# sourceMappingURL=validators.js.map