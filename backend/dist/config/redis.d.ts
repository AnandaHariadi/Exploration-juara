/**
 * redis.ts
 * IORedis singleton shared by BullMQ Queue and Worker.
 * Read connection URL from REDIS_URL env var.
 */
import IORedis from "ioredis";
export declare function getRedis(): IORedis;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map