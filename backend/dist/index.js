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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * CLARA Backend - Express application entry point
 *
 * Mounts:
 *   GET  /health              -> health check
 *   GET  /api/docs            -> Swagger UI
 *   GET  /api/v1/auth/google  -> OAuth redirect
 *   POST /api/v1/document/analyze -> async OCR (queued, returns 202)
 *   POST /api/v1/contract/review  -> Scan & Explain pipeline
 *   POST /api/v1/query           -> Legal Q&A
 *   POST /api/v1/drafter/chat    -> Smart Document Drafter
 *   POST /api/v1/integration/*   -> server-to-server API for the CLARA business app
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const neo4j_1 = require("./config/neo4j");
const initSchema_1 = require("./scripts/initSchema");
const swagger_1 = require("./config/swagger");
const passport_1 = require("./config/passport");
const contract_1 = __importDefault(require("./routes/contract"));
const document_1 = __importDefault(require("./routes/document"));
const query_1 = __importDefault(require("./routes/query"));
const drafter_1 = __importDefault(require("./routes/drafter"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const integration_1 = __importDefault(require("./routes/integration"));
const auth_2 = require("./middleware/auth");
// The BullMQ worker needs Redis; only start it when explicitly enabled so the
// AI service runs (and reports health) without Redis.
if (env_1.env.ENABLE_QUEUE) {
    void Promise.resolve().then(() => __importStar(require("./workers/analysisWorker")));
}
let neo4jStatus = "unknown";
const app = (0, express_1.default)();
// app.set('trust proxy', 1);
// Middleware
app.use((0, cors_1.default)({
    origin: [env_1.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "https://clara-ai-nine.vercel.app"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Required by passport even when we don't persist sessions (JWT-only flows)
app.use((0, express_session_1.default)({
    secret: env_1.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: env_1.env.NODE_ENV === "production" },
}));
app.use(passport_1.configuredPassport.initialize());
// Health check: reports which AI capabilities are usable, never secret values.
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "CLARA AI Service",
        version: "1.1.0",
        timestamp: new Date().toISOString(),
        ai: {
            gemini: (0, env_1.aiConfigured)(),
            model: env_1.env.GEMINI_MODEL,
            neo4j: neo4jStatus,
            redis: env_1.env.ENABLE_QUEUE ? "enabled" : "disabled",
        },
    });
});
// Swagger UI
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customSiteTitle: "CLARA API Docs",
}));
// Auth routes(public)   ─
app.use("/api/v1/auth", auth_1.default);
// Protected API routes   ─
// verifyToken is applied here but document.ts still accepts without auth as fallback
app.use("/api/v1/contract", auth_2.verifyToken, contract_1.default);
app.use("/api/v1/document", document_1.default); // Auth optional – worker handles userId
app.use("/api/v1/query", auth_2.verifyToken, query_1.default);
app.use("/api/v1/drafter", auth_2.verifyToken, drafter_1.default);
app.use("/api/v1/chat", auth_2.verifyToken, chat_1.default);
app.use("/api/v1/integration", integration_1.default);
// 404    
app.use((_req, res) => {
    res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Route not found" });
});
// Startup   ─
// Neo4j is optional (legal RAG only). Check it in the background so the AI
// service is reachable immediately even when the graph database is down.
async function connectNeo4j() {
    try {
        await Promise.race([
            (async () => {
                await (0, neo4j_1.verifyConnectivity)();
                await (0, initSchema_1.initSchema)();
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
        ]);
        neo4jStatus = "connected";
        console.log("✅ Neo4j schema ready.");
    }
    catch {
        neo4jStatus = "unavailable";
        console.warn("Neo4j not available — legal RAG answers will use project context and model knowledge only.");
    }
}
async function start() {
    void connectNeo4j();
    app.listen(env_1.env.PORT, () => {
        console.log(`CLARA backend running on http://localhost:${env_1.env.PORT}`);
        console.log(`Environment: ${env_1.env.NODE_ENV}`);
        console.log(`Gemini configured: ${(0, env_1.aiConfigured)() ? "yes" : "NO — set GOOGLE_AI_API_KEY"} · Queue: ${env_1.env.ENABLE_QUEUE ? "on" : "off"}`);
        console.log("");
        console.log("Endpoints:");
        console.log(`GET  http://localhost:${env_1.env.PORT}/health`);
        console.log(`GET  http://localhost:${env_1.env.PORT}/api/docs  ← Swagger UI`);
        console.log(`GET  http://localhost:${env_1.env.PORT}/api/v1/auth/google`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/document/analyze  (→ 202 queued)`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/contract/review`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/query`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/drafter/chat`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/integration/extract`);
        console.log(`POST http://localhost:${env_1.env.PORT}/api/v1/integration/ask`);
    });
}
start();
//# sourceMappingURL=index.js.map