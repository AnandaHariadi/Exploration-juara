"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfigured = exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Optional settings never crash startup: the service reports what is missing
// through GET /health and fails individual requests with a clear error.
function optionalEnv(key, fallback = "") {
    return process.env[key]?.trim() || fallback;
}
exports.env = {
    PORT: parseInt(process.env.PORT ?? "3001", 10),
    NODE_ENV: process.env.NODE_ENV ?? "development",
    // Neo4j
    NEO4J_URI: optionalEnv("NEO4J_URI", "bolt://localhost:7687"),
    NEO4J_USER: optionalEnv("NEO4J_USER", "neo4j"),
    NEO4J_PASSWORD: optionalEnv("NEO4J_PASSWORD"),
    // Google AI / Gemini
    GOOGLE_AI_API_KEY: optionalEnv("GOOGLE_AI_API_KEY"),
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
    EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION ?? "768", 10),
    // Reasoning pipeline
    REASONING_PATHS: parseInt(process.env.REASONING_PATHS ?? "3", 10),
    TEMPERATURE_LOW: parseFloat(process.env.TEMPERATURE_LOW ?? "0.1"),
    TEMPERATURE_HIGH: parseFloat(process.env.TEMPERATURE_HIGH ?? "0.7"),
    MAX_CONTEXT_TOKENS: parseInt(process.env.MAX_CONTEXT_TOKENS ?? "8192", 10),
    // Hybrid retrieval weights
    TOP_K_DENSE: parseInt(process.env.TOP_K_DENSE ?? "5", 10),
    TOP_K_BM25: parseInt(process.env.TOP_K_BM25 ?? "5", 10),
    TOP_K_SYMBOLIC: parseInt(process.env.TOP_K_SYMBOLIC ?? "5", 10),
    HYBRID_DENSE_WEIGHT: parseFloat(process.env.HYBRID_DENSE_WEIGHT ?? "0.5"),
    HYBRID_BM25_WEIGHT: parseFloat(process.env.HYBRID_BM25_WEIGHT ?? "0.3"),
    HYBRID_SYMBOLIC_WEIGHT: parseFloat(process.env.HYBRID_SYMBOLIC_WEIGHT ?? "0.2"),
    // File upload
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10),
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? "./uploads",
    // OAuth + JWT (Module 2)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? process.env.OAUTH_GOOGLE_CLIENT_ID ?? "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? "",
    JWT_SECRET: process.env.JWT_SECRET ?? "change_me_in_production",
    FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",
    // Queue (Module 4)
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    // BullMQ worker for the legacy async /document/analyze flow. Off unless Redis is available.
    ENABLE_QUEUE: process.env.ENABLE_QUEUE === "true",
    // Shared secret for server-to-server calls from the CLARA Next.js app.
    AI_SERVICE_KEY: optionalEnv("AI_SERVICE_KEY"),
    // Drafter (Module 5)
    DRAFTER_MIN_CONFIDENCE: parseFloat(process.env.DRAFTER_MIN_CONFIDENCE ?? "0.8"),
};
const aiConfigured = () => exports.env.GOOGLE_AI_API_KEY.length > 0;
exports.aiConfigured = aiConfigured;
//# sourceMappingURL=env.js.map