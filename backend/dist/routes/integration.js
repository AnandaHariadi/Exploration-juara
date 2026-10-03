"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * integration.ts
 * Server-to-server API used by the CLARA business app (Next.js). The browser
 * never calls these routes; the Next.js server forwards requests with the
 * shared AI_SERVICE_KEY.
 *
 *   POST /api/v1/integration/extract       – document file (+kind) → structured extraction + evidence
 *   POST /api/v1/integration/ask           – legal / contract Q&A grounded in RAG + project data
 *   POST /api/v1/integration/draft         – Document Studio: generate a draft from verified facts
 *   POST /api/v1/integration/revise        – revise a draft with an instruction
 *   POST /api/v1/integration/review-draft  – self-review: AI consistency pass + guardrails
 *   POST /api/v1/integration/explain       – plain-language explanation of an anomaly
 *   POST /api/v1/integration/render-pdf    – markdown draft → PDF (legacy CLARA renderer)
 */
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const contractExtractionService_1 = require("../services/extraction/contractExtractionService");
const studioService_1 = require("../services/studio/studioService");
const pdfService_1 = require("../services/drafter/pdfService");
const hybridRetrieval_1 = require("../services/retrieval/hybridRetrieval");
const reasoningService_1 = require("../services/reasoning/reasoningService");
const router = (0, express_1.Router)();
function requireServiceKey(req, res, next) {
    if (env_1.env.AI_SERVICE_KEY && req.header("x-clara-service-key") !== env_1.env.AI_SERVICE_KEY) {
        res.status(401).json((0, response_1.error)("UNAUTHORIZED", "Invalid service key."));
        return;
    }
    next();
}
function requireAi(_req, res, next) {
    if (!(0, env_1.aiConfigured)()) {
        res.status(503).json((0, response_1.error)("AI_NOT_CONFIGURED", "GOOGLE_AI_API_KEY belum diatur pada layanan AI."));
        return;
    }
    next();
}
router.use(requireServiceKey);
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error(`Tipe berkas ${file.mimetype} tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.`));
    },
});
router.post("/extract", requireAi, (req, res) => {
    upload.single("file")(req, res, async (uploadErr) => {
        if (uploadErr) {
            res.status(400).json((0, response_1.error)("INVALID_FILE", uploadErr instanceof Error ? uploadErr.message : "Berkas tidak valid."));
            return;
        }
        if (!req.file) {
            res.status(400).json((0, response_1.error)("FILE_REQUIRED", "Field 'file' wajib berisi berkas kontrak."));
            return;
        }
        try {
            const fileName = String(req.body?.fileName || req.file.originalname || "dokumen").slice(0, 200);
            const rawKind = String(req.body?.kind || "CONTRACT").toUpperCase();
            const kind = ["CONTRACT", "ADDENDUM", "INVOICE", "OTHER"].includes(rawKind) ? rawKind : "OTHER";
            const data = await (0, contractExtractionService_1.analyzeDocument)(req.file.buffer, req.file.mimetype, fileName, kind);
            res.json((0, response_1.success)(data));
        }
        catch (err) {
            if (err instanceof contractExtractionService_1.AiNotConfiguredError) {
                res.status(503).json((0, response_1.error)("AI_NOT_CONFIGURED", err.message));
                return;
            }
            const message = err instanceof Error ? err.message : String(err);
            console.error("[AI] extraction failed:", message);
            res.status(502).json((0, response_1.error)("AI_EXTRACTION_FAILED", "Analisis dokumen gagal di layanan AI.", { reason: message.slice(0, 300) }));
        }
    });
});
const AskSchema = zod_1.z.object({
    question: zod_1.z.string().min(3).max(2000),
    projectContext: zod_1.z.string().max(30000).optional(),
    history: zod_1.z.array(zod_1.z.object({ role: zod_1.z.enum(["user", "assistant"]), content: zod_1.z.string().max(4000) })).max(10).optional(),
});
router.post("/ask", requireAi, async (req, res) => {
    const parsed = AskSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json((0, response_1.error)("VALIDATION_ERROR", "Pertanyaan tidak valid.", parsed.error.flatten().fieldErrors));
        return;
    }
    const { question, projectContext, history } = parsed.data;
    try {
        console.log(`[AI] legal question received chars=${question.length} projectContext=${Boolean(projectContext)}`);
        // Each retrieval leg already degrades to [] when Neo4j is unavailable.
        const legal = await (0, hybridRetrieval_1.hybridRetrieval)(question);
        const context = [...legal];
        if (projectContext) {
            context.unshift({
                id: "project-context",
                label: "ContractClause",
                title: "Data kesepakatan proyek (acuan aktif CLARA)",
                content: projectContext,
                score: 1,
                source: "CLARA – data proyek",
            });
        }
        const result = await (0, reasoningService_1.reason)(`${question}\n\n(Jawab dalam Bahasa Indonesia yang ringkas.)`, context, history);
        if (result.confidence === 0 && result.citations.length === 0 && /error occurred/i.test(result.answer)) {
            res.status(502).json((0, response_1.error)("AI_REASONING_FAILED", "Layanan AI gagal menghasilkan jawaban."));
            return;
        }
        console.log(`[AI] legal answer ready legalSources=${legal.length} confidence=${result.confidence}`);
        res.json((0, response_1.success)({
            answer: result.answer,
            citations: result.citations,
            confidence: result.confidence,
            confidenceLevel: result.confidence_level,
            confidenceLabel: result.confidence_label,
            contextUsed: { legalSources: legal.length, projectContext: Boolean(projectContext) },
        }));
    }
    catch (err) {
        console.error("[AI] legal question failed:", err instanceof Error ? err.message : err);
        res.status(502).json((0, response_1.error)("AI_REASONING_FAILED", "Layanan AI gagal menjawab pertanyaan."));
    }
});
const DRAFT_TYPES = ["CHANGE_REQUEST", "ADDENDUM", "MOU", "LOI", "PKS", "CLAUSE_REVISION", "ANOMALY_RESPONSE"];
const DraftSchema = zod_1.z.object({
    type: zod_1.z.enum(DRAFT_TYPES),
    title: zod_1.z.string().max(300).optional(),
    projectContext: zod_1.z.string().max(30000).optional(),
    facts: zod_1.z.array(zod_1.z.string().max(1000)).max(60).default([]),
    instructions: zod_1.z.string().max(4000).optional(),
    originalClause: zod_1.z.string().max(4000).optional(),
});
const ReviseSchema = zod_1.z.object({ content: zod_1.z.string().min(10).max(60000), instruction: zod_1.z.string().min(3).max(4000), facts: zod_1.z.array(zod_1.z.string().max(1000)).max(60).default([]) });
const ReviewSchema = zod_1.z.object({ content: zod_1.z.string().min(10).max(60000), facts: zod_1.z.array(zod_1.z.string().max(1000)).max(60).default([]) });
const ExplainSchema = zod_1.z.object({ title: zod_1.z.string().max(400), description: zod_1.z.string().max(2000), evidence: zod_1.z.array(zod_1.z.string().max(1000)).max(20).default([]), facts: zod_1.z.array(zod_1.z.string().max(1000)).max(40).default([]), projectContext: zod_1.z.string().max(30000).optional() });
function aiRoute(schema, handler, label) {
    return async (req, res) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json((0, response_1.error)("VALIDATION_ERROR", "Permintaan tidak valid.", parsed.error.flatten().fieldErrors));
            return;
        }
        try {
            res.json((0, response_1.success)(await handler(parsed.data)));
        }
        catch (err) {
            if (err instanceof contractExtractionService_1.AiNotConfiguredError) {
                res.status(503).json((0, response_1.error)("AI_NOT_CONFIGURED", err.message));
                return;
            }
            console.error(`[AI] ${label} failed:`, err instanceof Error ? err.message : err);
            res.status(502).json((0, response_1.error)("AI_FAILED", `Layanan AI gagal: ${label}.`));
        }
    };
}
router.post("/draft", requireAi, aiRoute(DraftSchema, (b) => (0, studioService_1.generateDraft)({ ...b, type: b.type }), "membuat draf"));
router.post("/revise", requireAi, aiRoute(ReviseSchema, (b) => (0, studioService_1.reviseDraft)(b.content, b.instruction, b.facts), "merevisi draf"));
router.post("/review-draft", requireAi, aiRoute(ReviewSchema, (b) => (0, studioService_1.reviewDraft)(b.content, b.facts), "meninjau draf"));
router.post("/explain", requireAi, aiRoute(ExplainSchema, (b) => (0, studioService_1.explainAnomaly)(b), "menjelaskan temuan"));
// PDF rendering needs no AI key: it reuses the legacy zero-dependency renderer.
router.post("/render-pdf", (req, res) => {
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!content.trim() || content.length > 60000) {
        res.status(400).json((0, response_1.error)("VALIDATION_ERROR", "content wajib diisi (maks. 60.000 karakter)."));
        return;
    }
    try {
        res.json((0, response_1.success)({ pdfBase64: (0, pdfService_1.generateDraftPdf)(content) }));
    }
    catch (err) {
        console.error("[AI] PDF render failed:", err instanceof Error ? err.message : err);
        res.status(500).json((0, response_1.error)("PDF_FAILED", "Gagal membuat PDF."));
    }
});
exports.default = router;
//# sourceMappingURL=integration.js.map