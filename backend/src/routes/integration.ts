/**
 * integration.ts
 * Server-to-server API used by the CLARA business app (Next.js). The browser
 * never calls these routes; the Next.js server forwards requests with the
 * shared AI_SERVICE_KEY.
 *
 *   POST /api/v1/integration/extract  – contract file → normalized extraction
 *   POST /api/v1/integration/ask      – legal / contract Q&A grounded in RAG + project data
 */
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { env, aiConfigured } from "../config/env";
import { success, error as apiError } from "../utils/response";
import { extractContract, AiNotConfiguredError } from "../services/extraction/contractExtractionService";
import { hybridRetrieval } from "../services/retrieval/hybridRetrieval";
import { reason } from "../services/reasoning/reasoningService";
import type { RetrievalResult } from "../services/retrieval/denseRetrieval";

const router = Router();

function requireServiceKey(req: Request, res: Response, next: NextFunction): void {
  if (env.AI_SERVICE_KEY && req.header("x-clara-service-key") !== env.AI_SERVICE_KEY) {
    res.status(401).json(apiError("UNAUTHORIZED", "Invalid service key."));
    return;
  }
  next();
}

function requireAi(_req: Request, res: Response, next: NextFunction): void {
  if (!aiConfigured()) {
    res.status(503).json(apiError("AI_NOT_CONFIGURED", "GOOGLE_AI_API_KEY belum diatur pada layanan AI."));
    return;
  }
  next();
}

router.use(requireServiceKey);

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe berkas ${file.mimetype} tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.`));
  },
});

router.post("/extract", requireAi, (req: Request, res: Response) => {
  upload.single("file")(req, res, async (uploadErr: unknown) => {
    if (uploadErr) {
      res.status(400).json(apiError("INVALID_FILE", uploadErr instanceof Error ? uploadErr.message : "Berkas tidak valid."));
      return;
    }
    if (!req.file) {
      res.status(400).json(apiError("FILE_REQUIRED", "Field 'file' wajib berisi berkas kontrak."));
      return;
    }
    try {
      const fileName = String(req.body?.fileName || req.file.originalname || "kontrak").slice(0, 200);
      const data = await extractContract(req.file.buffer, req.file.mimetype, fileName);
      res.json(success(data));
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        res.status(503).json(apiError("AI_NOT_CONFIGURED", err.message));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("[AI] extraction failed:", message);
      res.status(502).json(apiError("AI_EXTRACTION_FAILED", "Analisis dokumen gagal di layanan AI.", { reason: message.slice(0, 300) }));
    }
  });
});

const AskSchema = z.object({
  question: z.string().min(3).max(2000),
  projectContext: z.string().max(30_000).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(10).optional(),
});

router.post("/ask", requireAi, async (req: Request, res: Response) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(apiError("VALIDATION_ERROR", "Pertanyaan tidak valid.", parsed.error.flatten().fieldErrors));
    return;
  }
  const { question, projectContext, history } = parsed.data;
  try {
    console.log(`[AI] legal question received chars=${question.length} projectContext=${Boolean(projectContext)}`);
    // Each retrieval leg already degrades to [] when Neo4j is unavailable.
    const legal = await hybridRetrieval(question);
    const context: RetrievalResult[] = [...legal];
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
    const result = await reason(`${question}\n\n(Jawab dalam Bahasa Indonesia yang ringkas.)`, context, history);
    if (result.confidence === 0 && result.citations.length === 0 && /error occurred/i.test(result.answer)) {
      res.status(502).json(apiError("AI_REASONING_FAILED", "Layanan AI gagal menghasilkan jawaban."));
      return;
    }
    console.log(`[AI] legal answer ready legalSources=${legal.length} confidence=${result.confidence}`);
    res.json(
      success({
        answer: result.answer,
        citations: result.citations,
        confidence: result.confidence,
        confidenceLevel: result.confidence_level,
        confidenceLabel: result.confidence_label,
        contextUsed: { legalSources: legal.length, projectContext: Boolean(projectContext) },
      }),
    );
  } catch (err) {
    console.error("[AI] legal question failed:", err instanceof Error ? err.message : err);
    res.status(502).json(apiError("AI_REASONING_FAILED", "Layanan AI gagal menjawab pertanyaan."));
  }
});

export default router;
