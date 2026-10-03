"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.closeRedis = closeRedis;
/**
 * redis.ts
 * IORedis singleton shared by BullMQ Queue and Worker.
 * Read connection URL from REDIS_URL env var.
 */
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
let _redis = null;
function getRedis() {
    if (!_redis) {
        _redis = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: null, // required by BullMQ
            enableReadyCheck: false,
        });
        _redis.on("error", (err) => {
            console.warn("[Redis] connection error:", err.message);
        });
    }
    return _redis;
}
async function closeRedis() {
    if (_redis) {
        await _redis.quit();
        _redis = null;
    }
}
//# sourceMappingURL=redis.js.map