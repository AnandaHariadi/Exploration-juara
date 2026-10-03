"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisQueue = void 0;
/**
 * analysisQueue.ts
 * BullMQ Queue for async document analysis jobs.
 *
 * Payload shape:
 *   { documentId, userId, bufferBase64, mimeType }
 */
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.analysisQueue = new bullmq_1.Queue("document-analysis", {
    connection: (0, redis_1.getRedis)(),
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 3600, count: 200 }, // keep for 1 h
        removeOnFail: { age: 86400 }, // keep for 1 day
    },
});
//# sourceMappingURL=analysisQueue.js.map