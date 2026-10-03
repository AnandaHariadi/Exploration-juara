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
/**
 * query.ts
 * POST /api/v1/query
 *
 * General-purpose legal Q&A endpoint.
 * When document_id is provided:
 *   1. Tries hybrid retrieval (vector + BM25 + symbolic + contract clauses)
 *   2. If context is empty, falls back to fetching raw_text directly from the
 *      Document node in Neo4j and inserting it as conversation context.
 *
 * @swagger
 * tags:
 *   name: Query
 *   description: Legal Q&A with optional document context
 */
const express_1 = require("express");
const zod_1 = require("zod");
const hybridRetrieval_1 = require("../services/retrieval/hybridRetrieval");
const reasoningService_1 = require("../services/reasoning/reasoningService");
const neo4j_1 = require("../config/neo4j");
const uuid_1 = require("uuid");
const response_1 = require("../utils/response");
// --- Pindahkan import ke paling atas ---
const chatService_1 = require("../services/chat/chatService");
const router = (0, express_1.Router)();
const QuerySchema = zod_1.z.object({
    question: zod_1.z.string().min(3, "Question must be at least 3 characters"),
    document_id: zod_1.z.string().uuid().optional(),
    session_id: zod_1.z.string().optional(),
    history: zod_1.z
        .array(zod_1.z.object({ role: zod_1.z.enum(["user", "assistant"]), content: zod_1.z.string() }))
        .optional()
        .default([]),
});
// --- FUNGSI INI DIKEMBALIKAN (JANGAN DIHAPUS) ---
async function fetchDocumentText(documentId) {
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`MATCH (d:Document { id: $documentId })
       RETURN d.raw_text AS raw_text, d.filename AS filename
       LIMIT 1`, { documentId });
        if (result.records.length === 0)
            return null;
        const rawText = result.records[0].get("raw_text");
        return rawText ?? null;
    }
    catch {
        return null;
    }
    finally {
        await session.close();
    }
}
// ------------------------------------------------
/**
 * @swagger
 * /api/v1/query:
 *   post:
 *     summary: Legal Q&A with hybrid retrieval and optional document context
 *     description: |
 *       Ask a legal question with optional uploaded document context.
 *       When `document_id` is provided, the system first tries hybrid retrieval
 *       over stored clauses. If no clauses are found, it falls back to injecting
 *       the document's `raw_text` directly into the reasoning context.
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 3
 *                 example: "Siapa pihak pertama dan pihak kedua dalam MoU ini?"
 *               document_id:
 *                 type: string
 *                 format: uuid
 *                 description: "UUID returned from POST /api/v1/document/analyze"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Answer with citations and confidence score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 citations:
 *                   type: array
 *                 document_id:
 *                   type: string
 *                 context_count:
 *                   type: integer
 *                 context_source:
 *                   type: string
 *                   enum: [retrieval, raw_text, none]
 *                   description: "How the document context was injected"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", async (req, res) => {
    const parsed = QuerySchema.safeParse(req.body);
    if (!parsed.success) {
        res
            .status(400)
            .json((0, response_1.error)("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten().fieldErrors));
        return;
    }
    const { question, document_id, history, session_id: req_session_id, } = parsed.data;
    const userId = req.user?.userId ??
        "anonymous";
    const session_id = req_session_id ?? (0, uuid_1.v4)();
    try {
        // Penanganan Tipe TypeScript yang aman:
        // Mengakomodasi jika kembaliannya berupa Array langsung atau Object yang memiliki property 'history'
        const historyData = await (0, chatService_1.getSessionHistory)(session_id);
        const storedHistory = Array.isArray(historyData)
            ? historyData
            : (historyData.history ?? []);
        // 1. Save user's question immediately
        await (0, chatService_1.saveChatMessage)(session_id, userId, "query", "user", question, document_id);
        // 2. Hybrid retrieval (vector + BM25 + symbolic + contract clauses)
        const context = await (0, hybridRetrieval_1.hybridRetrieval)(question, document_id);
        let contextSource = "retrieval";
        // Combine frontend history with stored history and format for Gemini reasoning
        const baseHistory = storedHistory.length > 0 ? storedHistory : history;
        let extraHistory = baseHistory.map((h) => ({
            role: h.role === "assistant" || h.role === "model"
                ? "model"
                : "user",
            content: h.content,
        }));
        // 3. If document_id is provided but context is empty → inject raw_text directly
        if (document_id && context.length === 0) {
            const rawText = await fetchDocumentText(document_id);
            if (rawText) {
                // Prepend document content as a system-level message in the history
                extraHistory = [
                    {
                        role: "user",
                        content: `Here is the content of the uploaded document (document_id: ${document_id}):\n\n${rawText}\n\n---\nUse the document content above as context to answer the following question.`,
                    },
                    ...extraHistory,
                ];
                contextSource = "raw_text";
            }
            else {
                contextSource = "none";
            }
        }
        const reasoning = await (0, reasoningService_1.reason)(question, context, extraHistory);
        // 4. Save assistant response
        await (0, chatService_1.saveChatMessage)(session_id, userId, "query", "assistant", reasoning.answer, document_id);
        res.json((0, response_1.success)({
            session_id,
            answer: reasoning.answer,
            confidence: reasoning.confidence,
            citations: reasoning.citations,
            document_id: document_id ?? null,
            context_count: context.length,
            context_source: contextSource,
            language: "id",
        }));
    }
    catch (err) {
        console.error("[query]", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        res.status(500).json((0, response_1.error)("INTERNAL", message));
    }
});
/**
 * @swagger
 * /api/v1/query/history/{sessionId}:
 *   get:
 *     summary: Retrieve chat history for a specific query session
 *     tags: [Query]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history
 *       401:
 *         description: Unauthorized
 */
router.get("/history/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const { getSessionHistory } = await Promise.resolve().then(() => __importStar(require("../services/chat/chatService")));
        const historyData = await getSessionHistory(sessionId);
        const history = Array.isArray(historyData)
            ? historyData
            : historyData.history ?? [];
        res.json((0, response_1.success)({
            session_id: sessionId,
            history,
        }));
    }
    catch (err) {
        console.error("[query/history]", err);
        res.status(500).json((0, response_1.error)("INTERNAL", "Failed to retrieve chat history"));
    }
});
/**
 * @swagger
 * /api/v1/query/sessions:
 *   get:
 *     summary: List all query chat sessions for the current user
 *     tags: [Query]
 *     responses:
 *       200:
 *         description: List of sessions
 *       401:
 *         description: Unauthorized
 */
router.get("/sessions", async (req, res) => {
    const userId = req.user?.userId ?? "anonymous";
    try {
        const session = await (0, neo4j_1.getSession)();
        const result = await session.run(`
            MATCH (cs:ChatSession { user_id: $userId, endpoint_type: 'query' })
            OPTIONAL MATCH (cs)-[:HAS_MESSAGE]->(cm:ChatMessage)
            WITH cs, cm ORDER BY cm.timestamp ASC
            WITH cs.id AS sessionId, 
                 toString(cs.updated_at) AS lastUpdated, 
                 collect(cm.content) AS messages
            RETURN sessionId, 
                   lastUpdated, 
                   COALESCE(messages[0], 'Percakapan Baru') AS preview
            ORDER BY lastUpdated DESC
            `, { userId });
        await session.close();
        const sessions = result.records.map((record) => ({
            session_id: record.get("sessionId"),
            last_updated: record.get("lastUpdated"),
            preview: record.get("preview") || "Percakapan Baru",
        }));
        res.json((0, response_1.success)(sessions));
    }
    catch (err) {
        console.error("[query/sessions]", err);
        res.status(500).json((0, response_1.error)("INTERNAL", "Failed to retrieve sessions list"));
    }
});
exports.default = router;
//# sourceMappingURL=query.js.map