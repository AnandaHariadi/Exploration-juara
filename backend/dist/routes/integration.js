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
 *   POST /api/v1/integration/extract  – contract file → normalized extraction
 *   POST /api/v1/integration/ask      – legal / contract Q&A grounded in RAG + project data
 */
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const contractExtractionService_1 = require("../services/extraction/contractExtractionService");
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
            const fileName = String(req.body?.fileName || req.file.originalname || "kontrak").slice(0, 200);
            const data = await (0, contractExtractionService_1.extractContract)(req.file.buffer, req.file.mimetype, fileName);
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
exports.default = router;
//# sourceMappingURL=integration.js.map