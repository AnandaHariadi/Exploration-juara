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
 * drafter.ts
 * POST /api/v1/drafter/chat
 *
 * Multi-turn document drafting (MoU / LoI / PKS).
 * Client must send full conversation history on every turn.
 *
 * @swagger
 * tags:
 *   name: Drafter
 *   description: Agentic multi-turn document drafter
 */
const express_1 = require("express");
const zod_1 = require("zod");
const drafterService_1 = require("../services/drafter/drafterService");
const neo4j_1 = require("../config/neo4j");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const ConversationTurnSchema = zod_1.z.object({
    role: zod_1.z.enum(["user", "assistant"]),
    content: zod_1.z.string(),
});
const DrafterChatSchema = zod_1.z.object({
    session_id: zod_1.z.string().min(1, "session_id is required"),
    message: zod_1.z.string().min(1, "message is required"),
});
/**
 * @swagger
 * /api/v1/drafter/chat:
 *   post:
 *     summary: Send a message to the agentic document drafter
 *     tags: [Drafter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, message]
 *             properties:
 *               session_id:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Drafter response (clarification or draft)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/chat", async (req, res) => {
    const parsed = DrafterChatSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json((0, response_1.error)("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten().fieldErrors));
        return;
    }
    const userId = req.user?.userId ?? "anonymous";
    try {
        const response = await (0, drafterService_1.runDrafterTurn)({ ...parsed.data, userId });
        res.json((0, response_1.success)(response));
    }
    catch (err) {
        console.error("[drafter/chat]", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        res.status(500).json((0, response_1.error)("INTERNAL", message));
    }
});
/**
 * @swagger
 * /api/v1/drafter/session/{sessionId}:
 *   get:
 *     summary: Retrieve existing Drafter session (fields + history)
 *     tags: [Drafter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session data
 *       404:
 *         description: Session not found
 */
//   GET /api/v1/drafter/session/:sessionId                   
router.get("/session/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const { getSessionHistory } = await Promise.resolve().then(() => __importStar(require("../services/chat/chatService")));
        const session = await (0, neo4j_1.getSession)();
        const result = await session.run(`MATCH (ds:DrafterSession { id: $sessionId }) RETURN ds`, { sessionId });
        await session.close();
        if (result.records.length === 0) {
            res.status(404).json((0, response_1.error)("NOT_FOUND", "Session not found"));
            return;
        }
        const ds = result.records[0].get("ds").properties;
        const { history } = await getSessionHistory(sessionId);
        res.json((0, response_1.success)({
            session_id: sessionId,
            document_type: ds.document_type,
            fields: JSON.parse(ds.fields),
            history
        }));
    }
    catch (err) {
        console.error("[drafter/session]", err);
        res.status(500).json((0, response_1.error)("INTERNAL", "Failed to retrieve session"));
    }
});
exports.default = router;
//# sourceMappingURL=drafter.js.map