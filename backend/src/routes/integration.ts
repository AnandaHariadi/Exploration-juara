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
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { env, aiConfigured } from "../config/env";
import { success, error as apiError } from "../utils/response";
import { analyzeDocument, AiNotConfiguredError, type AnalysisKind } from "../services/extraction/contractExtractionService";
import { generateDraft, reviseDraft, reviewDraft, explainAnomaly, type DraftType } from "../services/studio/studioService";
import { generateDraftPdf } from "../services/drafter/pdfService";
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
      const fileName = String(req.body?.fileName || req.file.originalname || "dokumen").slice(0, 200);
      const rawKind = String(req.body?.kind || "CONTRACT").toUpperCase();
      const kind: AnalysisKind = (["CONTRACT", "ADDENDUM", "INVOICE", "OTHER"] as const).includes(rawKind as AnalysisKind) ? (rawKind as AnalysisKind) : "OTHER";
      const data = await analyzeDocument(req.file.buffer, req.file.mimetype, fileName, kind);
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

const DRAFT_TYPES = ["CHANGE_REQUEST", "ADDENDUM", "MOU", "LOI", "PKS", "CLAUSE_REVISION", "ANOMALY_RESPONSE"] as const;
const DraftSchema = z.object({
  type: z.enum(DRAFT_TYPES),
  title: z.string().max(300).optional(),
  projectContext: z.string().max(30_000).optional(),
  facts: z.array(z.string().max(1000)).max(60).default([]),
  instructions: z.string().max(4000).optional(),
  originalClause: z.string().max(4000).optional(),
});
const ReviseSchema = z.object({ content: z.string().min(10).max(60_000), instruction: z.string().min(3).max(4000), facts: z.array(z.string().max(1000)).max(60).default([]) });
const ReviewSchema = z.object({ content: z.string().min(10).max(60_000), facts: z.array(z.string().max(1000)).max(60).default([]) });
const ExplainSchema = z.object({ title: z.string().max(400), description: z.string().max(2000), evidence: z.array(z.string().max(1000)).max(20).default([]), facts: z.array(z.string().max(1000)).max(40).default([]), projectContext: z.string().max(30_000).optional() });

type Handler = (body: never) => Promise<unknown>;
function aiRoute(schema: z.ZodTypeAny, handler: Handler, label: string) {
  return async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(apiError("VALIDATION_ERROR", "Permintaan tidak valid.", parsed.error.flatten().fieldErrors));
      return;
    }
    try {
      res.json(success(await handler(parsed.data as never)));
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        res.status(503).json(apiError("AI_NOT_CONFIGURED", err.message));
        return;
      }
      console.error(`[AI] ${label} failed:`, err instanceof Error ? err.message : err);
      res.status(502).json(apiError("AI_FAILED", `Layanan AI gagal: ${label}.`));
    }
  };
}

router.post("/draft", requireAi, aiRoute(DraftSchema, (b: z.infer<typeof DraftSchema>) => generateDraft({ ...b, type: b.type as DraftType }), "membuat draf"));
router.post("/revise", requireAi, aiRoute(ReviseSchema, (b: z.infer<typeof ReviseSchema>) => reviseDraft(b.content, b.instruction, b.facts), "merevisi draf"));
router.post("/review-draft", requireAi, aiRoute(ReviewSchema, (b: z.infer<typeof ReviewSchema>) => reviewDraft(b.content, b.facts), "meninjau draf"));
router.post("/explain", requireAi, aiRoute(ExplainSchema, (b: z.infer<typeof ExplainSchema>) => explainAnomaly(b), "menjelaskan temuan"));

// PDF rendering needs no AI key: it reuses the legacy zero-dependency renderer.
router.post("/render-pdf", (req: Request, res: Response) => {
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  if (!content.trim() || content.length > 60_000) {
    res.status(400).json(apiError("VALIDATION_ERROR", "content wajib diisi (maks. 60.000 karakter)."));
    return;
  }
  try {
    res.json(success({ pdfBase64: generateDraftPdf(content) }));
  } catch (err) {
    console.error("[AI] PDF render failed:", err instanceof Error ? err.message : err);
    res.status(500).json(apiError("PDF_FAILED", "Gagal membuat PDF."));
  }
});

export default router;
