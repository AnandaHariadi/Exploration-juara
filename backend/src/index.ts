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
import express from "express";
import cors from "cors";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import { env, aiConfigured } from "./config/env";
import { verifyConnectivity } from "./config/neo4j";
import { initSchema } from "./scripts/initSchema";
import { swaggerSpec } from "./config/swagger";
import { configuredPassport } from "./config/passport";
import contractRouter from "./routes/contract";
import documentRouter from "./routes/document";
import queryRouter from "./routes/query";
import drafterRouter from "./routes/drafter";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import integrationRouter from "./routes/integration";
import { verifyToken } from "./middleware/auth";

// The BullMQ worker needs Redis; only start it when explicitly enabled so the
// AI service runs (and reports health) without Redis.
if (env.ENABLE_QUEUE) {
    void import("./workers/analysisWorker");
}

let neo4jStatus: "connected" | "unavailable" | "unknown" = "unknown";

const app = express();
// app.set('trust proxy', 1);

// Middleware
app.use(
    cors({
        origin: [env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "https://clara-ai-nine.vercel.app"],
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Required by passport even when we don't persist sessions (JWT-only flows)
app.use(
    session({
        secret: env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: env.NODE_ENV === "production" },
    }),
);
app.use(configuredPassport.initialize());

// Health check: reports which AI capabilities are usable, never secret values.
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "CLARA AI Service",
        version: "1.1.0",
        timestamp: new Date().toISOString(),
        ai: {
            gemini: aiConfigured(),
            model: env.GEMINI_MODEL,
            neo4j: neo4jStatus,
            redis: env.ENABLE_QUEUE ? "enabled" : "disabled",
        },
    });
});

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "CLARA API Docs",
}));

// Auth routes(public)   ─
app.use("/api/v1/auth", authRouter);

// Protected API routes   ─
// verifyToken is applied here but document.ts still accepts without auth as fallback
app.use("/api/v1/contract", verifyToken, contractRouter);
app.use("/api/v1/document", documentRouter); // Auth optional – worker handles userId
app.use("/api/v1/query", verifyToken, queryRouter);
app.use("/api/v1/drafter", verifyToken, drafterRouter);
app.use("/api/v1/chat", verifyToken, chatRouter);
app.use("/api/v1/integration", integrationRouter);

// 404    
app.use((_req, res) => {
    res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Route not found" });
});

// Startup   ─
// Neo4j is optional (legal RAG only). Check it in the background so the AI
// service is reachable immediately even when the graph database is down.
async function connectNeo4j(): Promise<void> {
    try {
        await Promise.race([
            (async () => {
                await verifyConnectivity();
                await initSchema();
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
        ]);
        neo4jStatus = "connected";
        console.log("✅ Neo4j schema ready.");
    } catch {
        neo4jStatus = "unavailable";
        console.warn("Neo4j not available — legal RAG answers will use project context and model knowledge only.");
    }
}

async function start(): Promise<void> {
    void connectNeo4j();

    app.listen(env.PORT, () => {
        console.log(`CLARA backend running on http://localhost:${env.PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`Gemini configured: ${aiConfigured() ? "yes" : "NO — set GOOGLE_AI_API_KEY"} · Queue: ${env.ENABLE_QUEUE ? "on" : "off"}`);
        console.log("");
        console.log("Endpoints:");
        console.log(`GET  http://localhost:${env.PORT}/health`);
        console.log(`GET  http://localhost:${env.PORT}/api/docs  ← Swagger UI`);
        console.log(`GET  http://localhost:${env.PORT}/api/v1/auth/google`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/document/analyze  (→ 202 queued)`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/contract/review`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/query`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/drafter/chat`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/integration/extract`);
        console.log(`POST http://localhost:${env.PORT}/api/v1/integration/ask`);
    });
}

start();