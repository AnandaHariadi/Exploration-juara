// Server-only client for the CLARA AI service (backend/, Express + Gemini).
// The browser never sees the AI service URL or key: it calls Next.js API
// routes, which call this module.

import type { AiHealth, CandidateMilestone, CandidateRisk, ContractTerms, DocumentAnalysis, DraftType, ExtractionCandidate, InvoiceAnalysis, LegalAnswer, SourceRef } from '@/types';
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

// ---------------------------------------------------------------- document analysis

interface RawEvidence {
  page: number | null;
  snippet: string;
  verified: boolean;
}

type AiKind = 'CONTRACT' | 'ADDENDUM' | 'INVOICE' | 'OTHER';

interface RawAnalysis {
  kind: AiKind;
  documentType: string;
  confidence: number | null;
  summary: string;
  contract: Record<string, unknown> | null;
  terms: Record<string, unknown> | null;
  milestones: { name: unknown; billingPercentage: unknown; trigger: unknown; targetDate: unknown; evidence: RawEvidence | null }[];
  invoice: (Record<string, unknown> & { lineItems?: Record<string, unknown>[] }) | null;
  approval: Record<string, unknown> | null;
  fieldEvidence: Record<string, RawEvidence>;
  risks: { title: unknown; severity: unknown; detail: unknown; evidence: RawEvidence | null; origin?: unknown }[];
  warnings: unknown[];
  extractionMeta: { sourceFile?: string; pages?: number | null; processedAt?: string; engine?: string };
}

/**
 * Normalized AI output: the single contract between the AI layer and business
 * data. Every field is re-validated here; the frontend never sees raw AI shapes.
 */
export interface NormalizedAnalysis {
  documentType: string;
  confidence: number | null;
  summary: string;
  contract: ExtractionCandidate['contract'];
  terms: ContractTerms;
  milestones: CandidateMilestone[];
  invoice: InvoiceAnalysis | null;
  approval: DocumentAnalysis['approval'] | null;
  sources: Record<string, SourceRef>;
  risks: (CandidateRisk & { origin: 'AI' | 'GUARDRAIL' })[];
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
export function normalizeAnalysis(raw: RawAnalysis, documentId: string): NormalizedAnalysis {
  if (!raw || typeof raw !== 'object' || typeof raw.documentType !== 'string') {
    throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Analisis gagal — format hasil AI tidak valid.');
  }
  const warnings = list(raw.warnings);
  const money = (v: unknown, label: string, allowZero = false) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < (allowZero ? 0 : 1) || v > 1_000_000_000_000) {
      warnings.push(`${label} dari AI tidak masuk akal dan dikosongkan; isi manual.`);
      return null;
    }
    return v;
  };
  const count = (v: unknown, label: string, max = 1000) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > max) {
      warnings.push(`${label} dari AI tidak valid dan dikosongkan.`);
      return null;
    }
    return v;
  };
  const percent = (v: unknown, label: string) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) {
      warnings.push(`${label} dari AI tidak valid dan dikosongkan.`);
      return null;
    }
    return v;
  };
  const quantity = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1_000_000 ? v : null);
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
  if (sources.revisionUnitPrice && !sources.revisionExtensionDays) sources.revisionExtensionDays = sources.revisionUnitPrice;

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

  const c = raw.contract ?? {};
  const t = raw.terms ?? {};
  const inv = raw.invoice;
  const severity = (v: unknown): CandidateRisk['severity'] => (v === 'HIGH' || v === 'LOW' ? v : 'MEDIUM');
  const meta = raw.extractionMeta ?? {};
  return {
    documentType: text(raw.documentType, 40) || 'OTHER',
    confidence: typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1 ? Math.round(raw.confidence * 100) / 100 : null,
    summary: text(raw.summary, 600),
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
    terms: {
      hourlyRate: money(t.hourlyRate, 'Tarif per jam'),
      revisionUnitPrice: money(t.revisionUnitPrice, 'Biaya revisi tambahan'),
      revisionExtensionDays: count(t.revisionExtensionDays, 'Tambahan hari revisi', 365),
      penaltyPerDayPercent: percent(t.penaltyPerDayPercent, 'Denda per hari'),
      penaltyCapPercent: percent(t.penaltyCapPercent, 'Batas denda'),
      paymentDueDays: count(t.paymentDueDays, 'Tempo pembayaran', 365),
    },
    milestones,
    invoice: inv
      ? {
          invoiceNumber: text(inv.invoiceNumber, 80) || null,
          issueDate: date(inv.issueDate, 'Tanggal invoice'),
          total: money(inv.total, 'Total invoice', true),
          milestoneReference: text(inv.milestoneReference, 200) || null,
          revisionsCharged: count(inv.revisionsCharged, 'Revisi ditagih'),
          lineItems: (Array.isArray(inv.lineItems) ? inv.lineItems : []).slice(0, 50).map((l, i) => ({
            description: text(l.description, 200) || `Baris ${i + 1}`,
            quantity: quantity(l.quantity),
            unit: text(l.unit, 40) || null,
            unitPrice: money(l.unitPrice, `Harga satuan baris ${i + 1}`, true),
            amount: money(l.amount, `Jumlah baris ${i + 1}`, true),
            source: evidence(l.evidence as RawEvidence | null, documentId),
          })),
        }
      : null,
    approval: raw.approval
      ? {
          approved: typeof raw.approval.approved === 'boolean' ? raw.approval.approved : null,
          approver: text(raw.approval.approver, 160) || null,
          date: date(raw.approval.date, 'Tanggal persetujuan'),
          reference: text(raw.approval.reference, 200) || null,
        }
      : null,
    sources,
    risks: (Array.isArray(raw.risks) ? raw.risks : []).slice(0, 15).map((r) => ({
      title: text(r.title, 160) || 'Klausul perlu diperhatikan',
      severity: severity(r.severity),
      detail: text(r.detail, 600),
      source: evidence(r.evidence, documentId),
      origin: r.origin === 'GUARDRAIL' ? ('GUARDRAIL' as const) : ('AI' as const),
    })),
    warnings: [...new Set(warnings)],
    extractionMeta: {
      sourceFile: text(meta.sourceFile, 200) || 'dokumen',
      pages: Number.isInteger(meta.pages) ? (meta.pages as number) : null,
      processedAt: typeof meta.processedAt === 'string' ? meta.processedAt : new Date().toISOString(),
      engine: text(meta.engine, 80) || 'CLARA AI',
      documentId,
    },
  };
}

export async function aiAnalyzeDocument(file: Buffer, fileName: string, mimeType: string, documentId: string, kind: AiKind): Promise<NormalizedAnalysis> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), fileName);
  form.append('fileName', fileName);
  form.append('kind', kind);
  console.log(`[AI] forwarding document=${documentId} kind=${kind} to AI service`);
  const raw = await callAi<RawAnalysis>('/api/v1/integration/extract', { method: 'POST', body: form }, EXTRACT_TIMEOUT_MS);
  return normalizeAnalysis(raw, documentId);
}

// ---------------------------------------------------------------- Document Studio / Remediation Copilot

const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export async function aiDraft(input: { type: DraftType; title?: string; projectContext?: string; facts: string[]; instructions?: string; originalClause?: string }) {
  const data = await callAi<{ content: string; engine: string }>('/api/v1/integration/draft', json(input), 90_000);
  if (!text(data?.content, 60_000)) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Layanan AI mengembalikan draf kosong.');
  return { content: data.content.slice(0, 60_000), engine: text(data.engine, 80) || 'CLARA AI' };
}

export async function aiRevise(content: string, instruction: string, facts: string[]) {
  const data = await callAi<{ content: string; engine: string }>('/api/v1/integration/revise', json({ content, instruction, facts }), 90_000);
  if (!text(data?.content, 60_000)) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Layanan AI mengembalikan revisi kosong.');
  return { content: data.content.slice(0, 60_000), engine: text(data.engine, 80) || 'CLARA AI' };
}

export async function aiReviewDraft(content: string, facts: string[]) {
  const data = await callAi<{ issues: { severity: string; message: string; origin: string }[] }>('/api/v1/integration/review-draft', json({ content, facts }), 60_000);
  return (Array.isArray(data?.issues) ? data.issues : []).slice(0, 20).map((i) => ({
    severity: i.severity === 'BLOCKER' || i.severity === 'WARNING' ? i.severity : 'INFO',
    message: text(i.message, 400),
    origin: i.origin === 'GUARDRAIL' ? ('GUARDRAIL' as const) : ('AI' as const),
  }));
}

export async function aiExplain(input: { title: string; description: string; evidence: string[]; facts: string[]; projectContext?: string }) {
  const data = await callAi<{ explanation: string; engine: string }>('/api/v1/integration/explain', json(input), 60_000);
  if (!text(data?.explanation, 4000)) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'Layanan AI mengembalikan penjelasan kosong.');
  return { text: data.explanation.slice(0, 4000), engine: text(data.engine, 80) || 'CLARA AI' };
}

/** Markdown → PDF via the legacy CLARA renderer on the AI service (no AI key needed). */
export async function aiRenderPdf(content: string): Promise<Buffer> {
  const data = await callAi<{ pdfBase64: string }>('/api/v1/integration/render-pdf', json({ content }), 30_000);
  return Buffer.from(data.pdfBase64, 'base64');
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
