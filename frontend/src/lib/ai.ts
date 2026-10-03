// Server-only client for the CLARA AI service (backend/, Express + Gemini).
// The browser never sees the AI service URL or key: it calls Next.js API
// routes, which call this module.

import type { AiHealth, CandidateMilestone, CandidateRisk, ExtractionCandidate, LegalAnswer, SourceRef } from '@/types';
import { HttpError } from './api';
import { isIsoDate } from './engine';

const AI_URL = (process.env.CLARA_AI_URL || 'http://localhost:3001').replace(/\/$/, '');
const AI_KEY = process.env.CLARA_AI_SERVICE_KEY || '';
const EXTRACT_TIMEOUT_MS = Number(process.env.CLARA_AI_TIMEOUT_MS || 150_000);

export const AI_UNAVAILABLE_MESSAGE = 'Analisis gagal — layanan AI tidak tersedia.';

interface RawEnvelope<T> {
  status?: string;
  data?: T;
  code?: string;
  message?: string;
}

async function callAi<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${AI_URL}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), ...(AI_KEY ? { 'x-clara-service-key': AI_KEY } : {}) },
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new HttpError(504, 'AI_TIMEOUT', 'Analisis gagal — layanan AI tidak merespons dalam batas waktu. Coba lagi.');
    console.error(`[AI] ${path} unreachable:`, error instanceof Error ? error.message : error);
    throw new HttpError(503, 'AI_UNAVAILABLE', AI_UNAVAILABLE_MESSAGE);
  }
  clearTimeout(timer);
  let body: RawEnvelope<T> | undefined;
  try {
    body = (await res.json()) as RawEnvelope<T>;
  } catch {
    body = undefined;
  }
  if (!res.ok || body?.status !== 'success' || body.data === undefined) {
    const code = body?.code ?? `AI_HTTP_${res.status}`;
    console.error(`[AI] ${path} failed: ${res.status} ${code} ${body?.message ?? ''}`);
    if (code === 'AI_NOT_CONFIGURED') throw new HttpError(503, code, 'Analisis gagal — layanan AI belum dikonfigurasi (kunci Gemini belum diatur di server AI).');
    if (code === 'INVALID_FILE' || code === 'FILE_REQUIRED' || code === 'VALIDATION_ERROR') throw new HttpError(400, code, body?.message ?? 'Permintaan ke layanan AI tidak valid.');
    if (res.status === 401) throw new HttpError(503, 'AI_AUTH_FAILED', 'Analisis gagal — kunci layanan AI tidak cocok.');
    throw new HttpError(502, code, body?.message ? `Analisis gagal — ${body.message}` : 'Analisis gagal — layanan AI mengembalikan galat.');
  }
  return body.data;
}

export async function aiHealth(): Promise<AiHealth> {
  const checkedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${AI_URL}/health`, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    const body = (await res.json()) as { service?: string; version?: string; ai?: { gemini?: boolean; neo4j?: string; redis?: string } };
    const gemini = Boolean(body.ai?.gemini);
    return {
      available: res.ok && gemini,
      url: AI_URL,
      service: body.service,
      version: body.version,
      ai: { gemini, neo4j: body.ai?.neo4j ?? 'unknown', redis: body.ai?.redis ?? 'unknown' },
      message: !res.ok ? 'Layanan AI merespons dengan galat.' : gemini ? 'Layanan AI siap.' : 'Layanan AI berjalan, tetapi kunci Gemini belum diatur.',
      checkedAt,
    };
  } catch {
    return { available: false, url: AI_URL, message: AI_UNAVAILABLE_MESSAGE, checkedAt };
  }
}

// ---------------------------------------------------------------- extraction

interface RawEvidence {
  page: number | null;
  snippet: string;
  verified: boolean;
}

interface RawExtraction {
  documentType: string;
  confidence: number | null;
  contract: Record<string, unknown>;
  milestones: { name: unknown; billingPercentage: unknown; trigger: unknown; targetDate: unknown; evidence: RawEvidence | null }[];
  fieldEvidence: Record<string, RawEvidence>;
  risks: { title: unknown; severity: unknown; detail: unknown; evidence: RawEvidence | null }[];
  warnings: unknown[];
  extractionMeta: { sourceFile?: string; pages?: number | null; processedAt?: string; engine?: string };
}

/** Normalized AI output: the one contract between the AI layer and business data. */
export interface NormalizedExtraction {
  documentType: 'CONTRACT' | 'NOT_CONTRACT';
  confidence: number | null;
  contract: ExtractionCandidate['contract'];
  milestones: CandidateMilestone[];
  sources: Record<string, SourceRef>;
  risks: CandidateRisk[];
  warnings: string[];
  extractionMeta: NonNullable<ExtractionCandidate['extractionMeta']>;
}

const text = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim().slice(0, 300)).slice(0, 30) : []);

function evidence(raw: RawEvidence | null | undefined, documentId: string): SourceRef | undefined {
  if (!raw || typeof raw.snippet !== 'string' || !raw.snippet.trim()) return undefined;
  return {
    documentId,
    page: raw.verified && Number.isInteger(raw.page) && (raw.page as number) > 0 ? raw.page : null,
    snippet: raw.snippet.trim().slice(0, 300),
    verified: raw.verified === true,
  };
}

/** Re-validate AI output at the business boundary. Impossible values become null + warning; nothing is coerced into a number. */
export function normalizeExtraction(raw: RawExtraction, documentId: string): NormalizedExtraction {
  if (!raw || typeof raw !== 'object' || !raw.contract || typeof raw.contract !== 'object') {
    throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Analisis gagal — format hasil AI tidak valid.');
  }
  const warnings = list(raw.warnings);
  const c = raw.contract;
  const money = (v: unknown, label: string) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v <= 0 || v > 1_000_000_000_000) {
      warnings.push(`${label} dari AI tidak masuk akal dan dikosongkan; isi manual.`);
      return null;
    }
    return v;
  };
  const count = (v: unknown, label: string) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 1000) {
      warnings.push(`${label} dari AI tidak valid dan dikosongkan.`);
      return null;
    }
    return v;
  };
  const date = (v: unknown, label: string) => {
    if (v === null || v === undefined || v === '') return null;
    if (!isIsoDate(v)) {
      warnings.push(`${label} dari AI bukan tanggal valid dan dikosongkan.`);
      return null;
    }
    return v;
  };

  const sources: Record<string, SourceRef> = {};
  for (const [key, ref] of Object.entries(raw.fieldEvidence ?? {})) {
    const source = evidence(ref, documentId);
    if (source) sources[key] = source;
  }

  const milestones: CandidateMilestone[] = (Array.isArray(raw.milestones) ? raw.milestones : []).slice(0, 20).map((m, i) => {
    const pct = typeof m.billingPercentage === 'number' && m.billingPercentage > 0 && m.billingPercentage <= 100 ? m.billingPercentage : null;
    if (m.billingPercentage !== null && m.billingPercentage !== undefined && pct === null) warnings.push(`Persentase termin ${i + 1} dari AI tidak valid dan dikosongkan.`);
    return {
      id: `MLS-${i + 1}`,
      title: text(m.name, 160) || `Termin ${i + 1}`,
      percentage: pct,
      trigger: text(m.trigger),
      targetDate: date(m.targetDate, `Target termin ${i + 1}`),
      source: evidence(m.evidence, documentId),
    };
  });

  const severity = (v: unknown): CandidateRisk['severity'] => (v === 'HIGH' || v === 'LOW' ? v : 'MEDIUM');
  const meta = raw.extractionMeta ?? {};
  return {
    documentType: raw.documentType === 'NOT_CONTRACT' ? 'NOT_CONTRACT' : 'CONTRACT',
    confidence: typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1 ? Math.round(raw.confidence * 100) / 100 : null,
    contract: {
      contractNumber: text(c.contractNumber, 120),
      title: text(c.title, 200),
      clientName: text(c.clientName, 160),
      contractValue: money(c.contractValue, 'Nilai kontrak'),
      startDate: date(c.startDate, 'Tanggal mulai'),
      deadline: date(c.deadline, 'Tenggat'),
      revisionLimit: count(c.revisionLimit, 'Batas revisi'),
      paymentTerms: text(c.paymentTermsSummary, 1000),
      scope: list(c.scope),
      obligations: list(c.obligations),
      penalties: list(c.penalties),
    },
    milestones,
    sources,
    risks: (Array.isArray(raw.risks) ? raw.risks : []).slice(0, 10).map((r) => ({
      title: text(r.title, 160) || 'Klausul perlu diperhatikan',
      severity: severity(r.severity),
      detail: text(r.detail, 600),
      source: evidence(r.evidence, documentId),
    })),
    warnings: [...new Set(warnings)],
    extractionMeta: {
      sourceFile: text(meta.sourceFile, 200) || 'kontrak',
      pages: Number.isInteger(meta.pages) ? (meta.pages as number) : null,
      processedAt: typeof meta.processedAt === 'string' ? meta.processedAt : new Date().toISOString(),
      engine: text(meta.engine, 80) || 'CLARA AI',
      documentId,
    },
  };
}

export async function aiExtractContract(file: Buffer, fileName: string, mimeType: string, documentId: string): Promise<NormalizedExtraction> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), fileName);
  form.append('fileName', fileName);
  console.log(`[AI] forwarding document=${documentId} to AI service`);
  const raw = await callAi<RawExtraction>('/api/v1/integration/extract', { method: 'POST', body: form }, EXTRACT_TIMEOUT_MS);
  return normalizeExtraction(raw, documentId);
}

export async function aiAsk(question: string, projectContext: string | undefined, history: { role: 'user' | 'assistant'; content: string }[]): Promise<LegalAnswer> {
  const data = await callAi<LegalAnswer>(
    '/api/v1/integration/ask',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, projectContext, history }) },
    90_000,
  );
  if (!data || typeof data.answer !== 'string' || !data.answer.trim()) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Layanan AI mengembalikan jawaban kosong.');
  return {
    answer: data.answer,
    citations: Array.isArray(data.citations) ? data.citations.slice(0, 20) : [],
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    confidenceLevel: data.confidenceLevel === 'green' || data.confidenceLevel === 'yellow' ? data.confidenceLevel : 'red',
    confidenceLabel: typeof data.confidenceLabel === 'string' ? data.confidenceLabel : '',
    contextUsed: data.contextUsed ?? { legalSources: 0, projectContext: Boolean(projectContext) },
  };
}
