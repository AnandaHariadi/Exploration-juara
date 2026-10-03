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
 * document.ts
 * POST /api/v1/document/analyze       – Upload, OCR, store Document node (with base64) + clauses in Neo4j
 * GET  /api/v1/document/:documentId   – Fetch stored document metadata + clauses by ID
 * GET  /api/v1/document/analyze/:jobId/status – Poll async job status (when Redis available)
 *
 * @swagger
 * tags:
 *   name: Document
 *   description: Contract document ingestion – OCR, clause extraction, embedding, and Neo4j storage
 */
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const ocrService_1 = require("../services/ocr/ocrService");
const embeddingService_1 = require("../services/embedding/embeddingService");
const guardrailService_1 = require("../services/guardrail/guardrailService");
const neo4j_1 = require("../config/neo4j");
const generative_ai_1 = require("@google/generative-ai");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const dashboardService_1 = require("../services/dashboard/dashboardService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10") * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/tiff",
            "image/bmp",
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WebP, TIFF, BMP.`));
        }
    },
});
//   Helpers     ─
async function saveDocumentNode(documentId, userId, filename, mimeType, fileBase64, rawText, pageCount, clauseCount) {
    const session = await (0, neo4j_1.getSession)();
    try {
        await session.run(`
      MERGE (d:Document { id: $id })
      SET d.user_id      = $userId,
          d.filename     = $filename,
          d.mime_type    = $mimeType,
          d.file_base64  = $fileBase64,
          d.raw_text     = $rawText,
          d.page_count   = $pageCount,
          d.clause_count = $clauseCount,
          d.created_at   = datetime()
      `, { id: documentId, userId, filename, mimeType, fileBase64, rawText, pageCount, clauseCount });
    }
    finally {
        await session.close();
    }
}
async function storeClauses(documentId, userId, clauses) {
    const session = await (0, neo4j_1.getSession)();
    const storedIds = [];
    try {
        for (const clause of clauses) {
            let embedding = [];
            try {
                embedding = await (0, embeddingService_1.embedText)(clause.content || clause.header, generative_ai_1.TaskType.RETRIEVAL_DOCUMENT);
            }
            catch {
                // Embedding failure doesn't block storage
            }
            const clauseId = `${documentId}-${clause.index}`;
            await session.run(`
        MERGE (cc:ContractClause { id: $id })
        SET cc.document_id = $documentId,
            cc.user_id     = $userId,
            cc.index       = $index,
            cc.header      = $header,
            cc.content     = $content,
            cc.embedding   = $embedding,
            cc.created_at  = datetime()
        WITH cc
        MATCH (d:Document { id: $documentId })
        MERGE (cc)-[:PART_OF]->(d)
        `, {
                id: clauseId,
                documentId,
                userId,
                index: clause.index,
                header: clause.header,
                content: clause.content,
                embedding,
            });
            storedIds.push(clauseId);
        }
    }
    finally {
        await session.close();
    }
    return storedIds;
}
//   POST /api/v1/document/analyze    
/**
 * @swagger
 * /api/v1/document/analyze:
 *   post:
 *     summary: Upload a contract document for OCR, clause extraction, and Neo4j storage
 *     tags: [Document]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document successfully processed and stored
 */
router.post("/analyze", auth_1.verifyToken, upload.single("file"), async (req, res) => {
    if (!req.file) {
        res.status(400).json((0, response_1.error)("MISSING_FILE", 'A file upload is required.'));
        return;
    }
    const documentId = (0, uuid_1.v4)();
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json((0, response_1.error)("UNAUTHORIZED", "User must be authenticated to analyze documents."));
        return;
    }
    const filename = req.file.originalname ?? `document-${documentId}`;
    const fileBase64 = req.file.buffer.toString("base64");
    try {
        const ocrResult = await (0, ocrService_1.processUploadedFile)(req.file.buffer, req.file.mimetype);
        const guardrail = await (0, guardrailService_1.runGuardrailChecks)(ocrResult.raw_text);
        await saveDocumentNode(documentId, userId, filename, req.file.mimetype, fileBase64, ocrResult.raw_text, ocrResult.page_count ?? null, ocrResult.clauses.length);
        const storedClauseIds = await storeClauses(documentId, userId, ocrResult.clauses);
        res.json((0, response_1.success)({
            document_id: documentId,
            filename,
            raw_text: ocrResult.raw_text,
            page_count: ocrResult.page_count ?? null,
            clause_count: ocrResult.clauses.length,
            clauses: ocrResult.clauses.map((c) => ({
                index: c.index,
                header: c.header,
                content_preview: c.content_preview,
            })),
            stored_clause_ids: storedClauseIds,
            guardrail: {
                is_safe: guardrail.is_safe,
                warning_count: guardrail.warning_count,
                critical_violations: guardrail.critical_violations,
            },
        }));
    }
    catch (err) {
        console.error("[document/analyze]", err);
        res.status(500).json((0, response_1.error)("ANALYSIS_ERROR", err instanceof Error ? err.message : "Internal server error"));
    }
});
//   GET /api/v1/document/user  
/**
 * @swagger
 * /api/v1/document/user:
 *   get:
 *     summary: Get all documents and drafter projects for the current user
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user projects and documents
 */
router.get("/user", auth_1.verifyToken, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId || userId === "anonymous") {
        res.status(401).json((0, response_1.error)("UNAUTHORIZED", "You must be logged in to view your documents."));
        return;
    }
    try {
        const history = await (0, dashboardService_1.getUserDashboard)(userId);
        res.json((0, response_1.success)(history));
    }
    catch (err) {
        console.error("[document/user]", err);
        res.status(500).json((0, response_1.error)("INTERNAL", err instanceof Error ? err.message : "Internal server error"));
    }
});
//   GET /api/v1/document/:documentId     ─
/**
 * @swagger
 * /api/v1/document/{documentId}:
 *   get:
 *     summary: Retrieve a stored document
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document found
 */
router.get("/:documentId", async (req, res) => {
    const { documentId } = req.params;
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
        MATCH (d:Document { id: $documentId })
        OPTIONAL MATCH (cc:ContractClause)-[:PART_OF]->(d)
        WITH d, cc ORDER BY cc.index ASC
        WITH d, collect({
          id:              cc.id,
          index:           cc.index,
          header:          cc.header,
          content_preview: substring(coalesce(cc.content, ''), 0, 200)
        }) AS clauses
        RETURN d, clauses
        `, { documentId });
        if (result.records.length === 0) {
            res.status(404).json((0, response_1.error)("NOT_FOUND", `Document "${documentId}" not found.`));
            return;
        }
        const record = result.records[0];
        const doc = record.get("d").properties;
        const clauses = record.get("clauses");
        res.json((0, response_1.success)({
            document_id: doc.id,
            filename: doc.filename,
            mime_type: doc.mime_type,
            page_count: doc.page_count,
            clause_count: doc.clause_count,
            raw_text: doc.raw_text,
            file_base64: doc.file_base64,
            created_at: doc.created_at,
            clauses: clauses.filter(c => c.id !== null),
        }));
    }
    catch (err) {
        console.error("[document/get]", err);
        res.status(500).json((0, response_1.error)("INTERNAL", err instanceof Error ? err.message : "Internal server error"));
    }
    finally {
        await session.close();
    }
});
//   GET /api/v1/document/analyze/:jobId/status   
/**
 * @swagger
 * /api/v1/document/analyze/{jobId}/status:
 *   get:
 *     summary: Poll the status of an async document analysis job
 *     tags: [Document]
 */
router.get("/analyze/:jobId/status", async (req, res) => {
    try {
        const { analysisQueue } = await Promise.resolve().then(() => __importStar(require("../queues/analysisQueue")));
        const jobId = req.params.jobId;
        const job = await analysisQueue.getJob(String(jobId));
        if (!job) {
            res.status(404).json((0, response_1.error)("JOB_NOT_FOUND", `Job ${jobId} not found.`));
            return;
        }
        const state = await job.getState();
        if (state === "completed") {
            res.json((0, response_1.success)({ status: "completed", result: job.returnvalue }));
        }
        else if (state === "failed") {
            res.json((0, response_1.success)({ status: "failed", reason: job.failedReason }));
        }
        else {
            res.json((0, response_1.success)({ status: state, progress: job.progress }));
        }
    }
    catch {
        res.status(503).json((0, response_1.error)("QUEUE_UNAVAILABLE", "Job queue is not available."));
    }
});
exports.default = router;
//# sourceMappingURL=document.js.map