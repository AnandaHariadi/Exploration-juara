/**
 * contractExtractionService.ts
 * Contract → structured commercial terms for the CLARA business layer.
 *
 * Pipeline:
 *   1. OCR with Gemini multimodal, keeping explicit page markers.
 *   2. Structured extraction with Gemini (JSON mode). The model only reads and
 *      quotes; it is told never to compute or guess values.
 *   3. Deterministic validation: types, ranges, dates.
 *   4. Evidence verification: every quote is searched in the OCR text. Page
 *      numbers come from the page markers, not from the model.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, aiConfigured } from "../../config/env";
import { applyOcrCorrections } from "../ocr/ocrService";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("GOOGLE_AI_API_KEY is not configured on the AI service.");
    this.name = "AiNotConfiguredError";
  }
}

export interface EvidenceRef {
  page: number | null;
  snippet: string;
  verified: boolean;
}

export interface ExtractedMilestone {
  name: string;
  billingPercentage: number | null;
  trigger: string;
  targetDate: string | null;
  evidence: EvidenceRef | null;
}

export interface ContractExtraction {
  documentType: "CONTRACT" | "NOT_CONTRACT";
  confidence: number | null;
  contract: {
    contractNumber: string | null;
    title: string | null;
    clientName: string | null;
    vendorName: string | null;
    contractValue: number | null;
    startDate: string | null;
    deadline: string | null;
    revisionLimit: number | null;
    paymentTermsSummary: string | null;
    scope: string[];
    obligations: string[];
    penalties: string[];
  };
  milestones: ExtractedMilestone[];
  fieldEvidence: Record<string, EvidenceRef>;
  risks: { title: string; severity: "LOW" | "MEDIUM" | "HIGH"; detail: string; evidence: EvidenceRef | null }[];
  warnings: string[];
  extractionMeta: { sourceFile: string; pages: number | null; processedAt: string; engine: string; textLength: number };
}

const PAGE_MARKER = /^=== HALAMAN (\d+) ===$/gm;

function model(json = false) {
  if (!aiConfigured()) throw new AiNotConfiguredError();
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  return genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: json ? { temperature: 0, responseMimeType: "application/json" } : { temperature: 0 },
  });
}

async function ocrWithPages(buffer: Buffer, mimeType: string): Promise<string> {
  const result = await model().generateContent([
    { inlineData: { data: buffer.toString("base64"), mimeType } },
    "Transkripsikan seluruh teks dokumen ini secara verbatim. Sebelum teks setiap halaman, tulis satu baris persis seperti ini: === HALAMAN <nomor> === (nomor dimulai dari 1). Pertahankan struktur pasal dan paragraf. Jangan menambahkan komentar, ringkasan, atau teks yang tidak ada di dokumen.",
  ]);
  const text = result.response.text().trim();
  if (!text) throw new Error("OCR returned no text.");
  return text.includes("=== HALAMAN") ? text : `=== HALAMAN 1 ===\n${text}`;
}

const EXTRACTION_PROMPT = `Anda adalah pembaca kontrak. Baca teks kontrak di bawah (setiap halaman diawali "=== HALAMAN n ===") dan kembalikan JSON dengan bentuk PERSIS:
{
  "document_type": "CONTRACT" atau "NOT_CONTRACT",
  "contract_number": string|null,
  "title": string|null,
  "client_name": string|null,          // pihak pemberi kerja / pembeli jasa
  "vendor_name": string|null,          // pihak pelaksana / penyedia jasa
  "contract_value": integer|null,      // nilai kontrak dalam rupiah persis seperti tertulis, tanpa titik/koma
  "start_date": "YYYY-MM-DD"|null,
  "deadline": "YYYY-MM-DD"|null,       // tanggal selesai pekerjaan
  "revision_limit": integer|null,      // jumlah putaran revisi yang termasuk nilai kontrak
  "payment_terms_summary": string|null,
  "scope": [string],                   // daftar pekerjaan yang disepakati
  "obligations": [string],
  "penalties": [string],
  "milestones": [{"name": string, "billing_percentage": number|null, "trigger": string, "target_date": "YYYY-MM-DD"|null, "evidence_quote": string|null}],
  "field_evidence": {"contract_number": string|null, "contract_value": string|null, "start_date": string|null, "deadline": string|null, "revision_limit": string|null, "scope": string|null},
  "risks": [{"title": string, "severity": "LOW"|"MEDIUM"|"HIGH", "detail": string, "evidence_quote": string|null}],
  "confidence": number,                // 0..1, keyakinan Anda atas keseluruhan hasil
  "warnings": [string]
}
ATURAN WAJIB:
- Isi null bila informasi tidak tertulis eksplisit. Jangan menebak, jangan menghitung, jangan membulatkan.
- milestones adalah termin pembayaran; billing_percentage persis seperti tertulis.
- Semua "evidence_quote" dan nilai "field_evidence" harus disalin VERBATIM dari teks (satu kalimat, maksimal 200 karakter), bukan parafrase.
- Jangan menyebut sesuatu sebagai pelanggaran. Risiko hanya menjelaskan klausul yang perlu diperhatikan.
- Jawab hanya JSON.`;

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Locate a quote in the OCR text; page is derived from the nearest preceding page marker. */
export function locateQuote(text: string, quote: string | null | undefined): EvidenceRef | null {
  if (!quote || typeof quote !== "string" || !quote.trim()) return null;
  const snippet = quote.trim().slice(0, 300);
  const haystack = normalize(text);
  const needle = normalize(snippet);
  // Allow a matching prefix when the model trimmed punctuation at the end.
  const probe = needle.length > 40 ? needle.slice(0, Math.max(40, needle.length - 3)) : needle;
  const index = haystack.indexOf(probe);
  if (index < 0) return { page: null, snippet, verified: false };
  let page: number | null = null;
  const markers = [...haystack.matchAll(/=== halaman (\d+) ===/g)];
  for (const marker of markers) {
    if ((marker.index ?? 0) <= index) page = Number(marker[1]);
  }
  return { page, snippet, verified: true };
}

const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

function asInt(value: unknown, field: string, warnings: string[], max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n < 0 || n > max) {
    warnings.push(`Nilai ${field} dari AI tidak valid (${String(value).slice(0, 40)}); dikosongkan untuk diisi manual.`);
    return null;
  }
  return n;
}

function asDate(value: unknown, field: string, warnings: string[]): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (!isIsoDate(value)) {
    warnings.push(`Tanggal ${field} dari AI tidak valid (${String(value).slice(0, 40)}); dikosongkan.`);
    return null;
  }
  return value;
}

const strOrNull = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const strList = (v: unknown, maxItems = 30) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim().slice(0, 300)).slice(0, maxItems) : []);

export async function extractContract(buffer: Buffer, mimeType: string, fileName: string): Promise<ContractExtraction> {
  console.log(`[AI] received document type=${mimeType} size=${buffer.length}`);
  console.log("[AI] OCR started");
  const raw = applyOcrCorrections(await ocrWithPages(buffer, mimeType));
  const pages = [...raw.matchAll(PAGE_MARKER)].length || null;
  console.log(`[AI] OCR completed pages=${pages ?? "?"} chars=${raw.length}`);

  console.log("[AI] extraction started");
  const result = await model(true).generateContent(`${EXTRACTION_PROMPT}\n\nTEKS KONTRAK:\n${raw.slice(0, 120_000)}`);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("AI returned malformed JSON for the extraction.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("AI returned an empty extraction.");
  console.log("[AI] extraction completed");

  const warnings: string[] = strList(parsed.warnings, 10);
  const fieldEvidenceRaw = (parsed.field_evidence ?? {}) as Record<string, unknown>;
  const fieldEvidence: Record<string, EvidenceRef> = {};
  const fieldKeys: Record<string, string> = {
    contract_number: "contractNumber",
    contract_value: "contractValue",
    start_date: "startDate",
    deadline: "deadline",
    revision_limit: "revisionLimit",
    scope: "scope",
  };
  for (const [rawKey, key] of Object.entries(fieldKeys)) {
    const ref = locateQuote(raw, fieldEvidenceRaw[rawKey] as string | null);
    if (ref) {
      fieldEvidence[key] = ref;
      if (!ref.verified) warnings.push(`Kutipan untuk ${key} tidak ditemukan di teks dokumen; periksa manual.`);
    }
  }

  const milestones: ExtractedMilestone[] = (Array.isArray(parsed.milestones) ? parsed.milestones : []).slice(0, 20).map((m: Record<string, unknown>, i: number) => {
    let pct: number | null = typeof m.billing_percentage === "number" ? m.billing_percentage : null;
    if (pct !== null && !(pct > 0 && pct <= 100)) {
      warnings.push(`Persentase termin ${i + 1} dari AI tidak valid (${pct}); dikosongkan.`);
      pct = null;
    }
    return {
      name: strOrNull(m.name, 160) ?? `Termin ${i + 1}`,
      billingPercentage: pct,
      trigger: strOrNull(m.trigger, 300) ?? "",
      targetDate: asDate(m.target_date, `target termin ${i + 1}`, warnings),
      evidence: locateQuote(raw, m.evidence_quote as string | null),
    };
  });
  const pctSum = milestones.reduce((s, m) => s + (m.billingPercentage ?? 0), 0);
  if (milestones.length && Math.abs(pctSum - 100) > 0.01) warnings.push(`Total persentase termin dari dokumen ${pctSum}% (bukan 100%). Periksa sebelum menyetujui.`);

  const severity = (v: unknown) => (v === "HIGH" || v === "MEDIUM" || v === "LOW" ? v : "MEDIUM");
  const extraction: ContractExtraction = {
    documentType: parsed.document_type === "NOT_CONTRACT" ? "NOT_CONTRACT" : "CONTRACT",
    confidence: typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1 ? parsed.confidence : null,
    contract: {
      contractNumber: strOrNull(parsed.contract_number, 120),
      title: strOrNull(parsed.title, 200),
      clientName: strOrNull(parsed.client_name, 160),
      vendorName: strOrNull(parsed.vendor_name, 160),
      contractValue: asInt(parsed.contract_value, "nilai kontrak", warnings, 1_000_000_000_000),
      startDate: asDate(parsed.start_date, "mulai", warnings),
      deadline: asDate(parsed.deadline, "tenggat", warnings),
      revisionLimit: asInt(parsed.revision_limit, "batas revisi", warnings, 1000),
      paymentTermsSummary: strOrNull(parsed.payment_terms_summary, 1000),
      scope: strList(parsed.scope),
      obligations: strList(parsed.obligations),
      penalties: strList(parsed.penalties),
    },
    milestones,
    fieldEvidence,
    risks: (Array.isArray(parsed.risks) ? parsed.risks : []).slice(0, 10).map((r: Record<string, unknown>) => ({
      title: strOrNull(r.title, 160) ?? "Klausul perlu diperhatikan",
      severity: severity(r.severity),
      detail: strOrNull(r.detail, 600) ?? "",
      evidence: locateQuote(raw, r.evidence_quote as string | null),
    })),
    warnings,
    extractionMeta: { sourceFile: fileName, pages, processedAt: new Date().toISOString(), engine: `Gemini ${env.GEMINI_MODEL}`, textLength: raw.length },
  };
  if (extraction.documentType === "NOT_CONTRACT") warnings.unshift("Dokumen tidak terdeteksi sebagai kontrak.");
  console.log(`[AI] response normalized milestones=${milestones.length} warnings=${warnings.length}`);
  return extraction;
}
