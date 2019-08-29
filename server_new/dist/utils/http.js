"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.response = (h, result, message, code) => {
    return h.response({
        result,
        message,
        code
    }).code(code);
};
//# sourceMappingURL=http.js.map