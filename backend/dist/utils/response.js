"use strict";
/**
 * response.ts
 * Unified API response envelope helpers.
 *
 * Every route should use success() / error() so the front-end always receives
 * a consistent shape: { status, data?, meta?, code?, message?, details? }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
function success(data, meta) {
    return { status: "success", data, ...(meta ? { meta } : {}) };
}
function error(code, message, details) {
    return {
        status: "error",
        code,
        message,
        ...(details !== undefined ? { details } : {}),
    };
}
//# sourceMappingURL=response.js.map