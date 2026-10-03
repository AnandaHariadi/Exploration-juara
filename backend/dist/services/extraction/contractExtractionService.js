"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractContract = exports.AiNotConfiguredError = void 0;
exports.model = model;
exports.locateQuote = locateQuote;
exports.analyzeDocument = analyzeDocument;
/**
 * contractExtractionService.ts — Document Guardian, AI side.
 *
 * Every uploaded business document goes through:
 *   1. OCR with Gemini multimodal, keeping explicit page markers.
 *   2. Structured extraction (JSON mode) with a prompt for the document kind:
 *      contract / addendum, invoice, or other supporting documents.
 *      The model only reads and quotes; it never computes or guesses values.
 *   3. Deterministic validation: types, ranges, dates.
 *   4. Evidence verification: every quote is searched in the OCR text; page
 *      numbers come from the page markers, not from the model.
 *   5. Legacy CLARA guardrails (Indonesian statutory/pattern checks) on contracts.
 */
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../../config/env");
const ocrService_1 = require("../ocr/ocrService");
const guardrailService_1 = require("../guardrail/guardrailService");
class AiNotConfiguredError extends Error {
    constructor() {
        super("GOOGLE_AI_API_KEY is not configured on the AI service.");
        this.name = "AiNotConfiguredError";
    }
}
exports.AiNotConfiguredError = AiNotConfiguredError;
const PAGE_MARKER = /^=== HALAMAN (\d+) ===$/gm;
function model(json = false, systemInstruction) {
    if (!(0, env_1.aiConfigured)())
        throw new AiNotConfiguredError();
    const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.env.GOOGLE_AI_API_KEY);
    return genAI.getGenerativeModel({
        model: env_1.env.GEMINI_MODEL,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: json ? { temperature: 0, responseMimeType: "application/json" } : { temperature: 0.2 },
    }, (0, env_1.geminiRequestOptions)());
}
async function ocrWithPages(buffer, mimeType) {
    const result = await model().generateContent([
        { inlineData: { data: buffer.toString("base64"), mimeType } },
        "Transkripsikan seluruh teks dokumen ini secara verbatim. Sebelum teks setiap halaman, tulis satu baris persis seperti ini: === HALAMAN <nomor> === (nomor dimulai dari 1). Pertahankan struktur pasal dan paragraf. Jangan menambahkan komentar, ringkasan, atau teks yang tidak ada di dokumen.",
    ]);
    const text = result.response.text().trim();
    if (!text)
        throw new Error("OCR returned no text.");
    return text.includes("=== HALAMAN") ? text : `=== HALAMAN 1 ===\n${text}`;
}
const RULES = `ATURAN WAJIB:
- Isi null bila informasi tidak tertulis eksplisit. Jangan menebak, jangan menghitung, jangan membulatkan.
- Semua kutipan ("evidence_quote" dan nilai di "field_evidence") harus disalin VERBATIM dari teks (satu kalimat, maksimal 200 karakter), bukan parafrase.
- Jangan menyebut sesuatu sebagai pelanggaran, penipuan, atau ilegal. Gunakan "perlu ditinjau", "potensi risiko", "kemungkinan tidak konsisten".
- Jawab hanya JSON.`;
const CONTRACT_PROMPT = `Anda adalah pembaca kontrak. Baca teks dokumen di bawah (setiap halaman diawali "=== HALAMAN n ===") dan kembalikan JSON dengan bentuk PERSIS:
{
  "document_type": "CONTRACT" | "ADDENDUM" | "INVOICE" | "OTHER",
  "summary": string,                   // 1-2 kalimat isi dokumen
  "contract_number": string|null,
  "title": string|null,
  "client_name": string|null,          // pihak pemberi kerja / pembeli jasa
  "vendor_name": string|null,          // pihak pelaksana / penyedia jasa
  "contract_value": integer|null,      // nilai kontrak (untuk adendum: nilai kontrak SETELAH adendum bila tertulis) dalam rupiah persis seperti tertulis
  "start_date": "YYYY-MM-DD"|null,
  "deadline": "YYYY-MM-DD"|null,       // tanggal selesai pekerjaan
  "revision_limit": integer|null,      // jumlah putaran revisi yang termasuk nilai kontrak
  "payment_terms_summary": string|null,
  "scope": [string],
  "obligations": [string],
  "penalties": [string],
  "terms": {
    "hourly_rate": integer|null,             // tarif pekerjaan tambahan per jam (rupiah)
    "revision_unit_price": integer|null,     // biaya per putaran revisi tambahan (rupiah)
    "revision_extension_days": integer|null, // tambahan hari untuk adendum revisi
    "penalty_per_day_percent": number|null,  // denda keterlambatan per hari, persen dari nilai kontrak
    "penalty_cap_percent": number|null,      // batas maksimum denda, persen dari nilai kontrak
    "payment_due_days": integer|null         // tempo pembayaran tagihan (hari)
  },
  "milestones": [{"name": string, "billing_percentage": number|null, "trigger": string, "target_date": "YYYY-MM-DD"|null, "evidence_quote": string|null}],
  "field_evidence": {"contract_number": string|null, "contract_value": string|null, "start_date": string|null, "deadline": string|null, "revision_limit": string|null, "scope": string|null, "hourly_rate": string|null, "revision_unit_price": string|null, "penalty": string|null},
  "risks": [{"title": string, "severity": "LOW"|"MEDIUM"|"HIGH", "detail": string, "evidence_quote": string|null}],  // klausul tidak lazim, samar, saling bertentangan, atau paparan denda/tanggung jawab tinggi
  "confidence": number,
  "warnings": [string]
}
milestones adalah termin pembayaran; billing_percentage persis seperti tertulis.
${RULES}`;
const INVOICE_PROMPT = `Anda adalah pembaca invoice/tagihan. Baca teks dokumen di bawah (setiap halaman diawali "=== HALAMAN n ===") dan kembalikan JSON dengan bentuk PERSIS:
{
  "document_type": "INVOICE" | "CONTRACT" | "ADDENDUM" | "OTHER",
  "summary": string,
  "invoice_number": string|null,
  "issue_date": "YYYY-MM-DD"|null,
  "issuer": string|null,
  "recipient": string|null,
  "total": integer|null,                    // total tagihan dalam rupiah persis seperti tertulis
  "milestone_reference": string|null,       // termin/tahap yang ditagih, persis seperti tertulis
  "revisions_charged": integer|null,        // jumlah total putaran revisi yang disebut/ditagih dalam invoice
  "line_items": [{"description": string, "quantity": number|null, "unit": string|null, "unit_price": integer|null, "amount": integer|null, "evidence_quote": string|null}],
  "field_evidence": {"invoice_number": string|null, "total": string|null, "milestone_reference": string|null},
  "risks": [{"title": string, "severity": "LOW"|"MEDIUM"|"HIGH", "detail": string, "evidence_quote": string|null}],
  "confidence": number,
  "warnings": [string]
}
Jangan menghitung ulang angka; salin angka seperti tertulis.
${RULES}`;
const OTHER_PROMPT = `Anda adalah asisten dokumen bisnis. Baca teks dokumen di bawah (setiap halaman diawali "=== HALAMAN n ===") dan kembalikan JSON dengan bentuk PERSIS:
{
  "document_type": "CLIENT_APPROVAL" | "QUOTATION" | "SOW" | "MINUTES" | "CONTRACT" | "ADDENDUM" | "INVOICE" | "OTHER",
  "summary": string,
  "approval": {"approved": boolean|null, "approver": string|null, "date": "YYYY-MM-DD"|null, "reference": string|null},
  "key_points": [{"text": string, "evidence_quote": string|null}],
  "confidence": number,
  "warnings": [string]
}
${RULES}`;
const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
/** Locate a quote in the OCR text; page is derived from the nearest preceding page marker. */
function locateQuote(text, quote) {
    if (!quote || typeof quote !== "string" || !quote.trim())
        return null;
    const snippet = quote.trim().slice(0, 300);
    const haystack = normalize(text);
    const needle = normalize(snippet);
    // Allow a matching prefix when the model trimmed punctuation at the end.
    const probe = needle.length > 40 ? needle.slice(0, Math.max(40, needle.length - 3)) : needle;
    const index = haystack.indexOf(probe);
    if (index < 0)
        return { page: null, snippet, verified: false };
    let page = null;
    for (const marker of haystack.matchAll(/=== halaman (\d+) ===/g)) {
        if ((marker.index ?? 0) <= index)
            page = Number(marker[1]);
    }
    return { page, snippet, verified: true };
}
const isIsoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
function asInt(value, field, warnings, max) {
    if (value === null || value === undefined || value === "")
        return null;
    const n = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
    if (!Number.isSafeInteger(n) || n < 0 || n > max) {
        warnings.push(`Nilai ${field} dari AI tidak valid (${String(value).slice(0, 40)}); dikosongkan untuk diisi manual.`);
        return null;
    }
    return n;
}
function asNum(value, field, warnings, max) {
    if (value === null || value === undefined || value === "")
        return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) {
        warnings.push(`Nilai ${field} dari AI tidak valid (${String(value).slice(0, 40)}); dikosongkan.`);
        return null;
    }
    return value;
}
function asDate(value, field, warnings) {
    if (value === null || value === undefined || value === "")
        return null;
    if (!isIsoDate(value)) {
        warnings.push(`Tanggal ${field} dari AI tidak valid (${String(value).slice(0, 40)}); dikosongkan.`);
        return null;
    }
    return value;
}
const strOrNull = (v, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const strList = (v, maxItems = 30) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 300)).slice(0, maxItems) : []);
const severity = (v) => (v === "HIGH" || v === "MEDIUM" || v === "LOW" ? v : "MEDIUM");
function evidenceFields(raw, source, keys, warnings) {
    const fieldEvidenceRaw = (source ?? {});
    const result = {};
    for (const [rawKey, key] of Object.entries(keys)) {
        const ref = locateQuote(raw, fieldEvidenceRaw[rawKey]);
        if (ref) {
            result[key] = ref;
            if (!ref.verified)
                warnings.push(`Kutipan untuk ${key} tidak ditemukan di teks dokumen; periksa manual.`);
        }
    }
    return result;
}
async function askJson(prompt, raw) {
    const result = await model(true).generateContent(`${prompt}\n\nTEKS DOKUMEN:\n${raw.slice(0, 120000)}`);
    let parsed;
    try {
        parsed = JSON.parse(result.response.text());
    }
    catch {
        throw new Error("AI returned malformed JSON for the extraction.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("AI returned an empty extraction.");
    return parsed;
}
/** Map legacy guardrail checks (statutory patterns) to risk findings. */
async function guardrailRisks(raw) {
    try {
        const report = await (0, guardrailService_1.runGuardrailChecks)(raw);
        return report.checks
            .filter((c) => c.triggered)
            .map((c) => ({
            title: `Guardrail: ${c.name.replace(/_/g, " ")}`,
            severity: c.severity === "CRITICAL" ? "HIGH" : c.severity === "WARNING" ? "MEDIUM" : "LOW",
            detail: `${c.message} ${c.advice}${c.legal_basis ? ` (Dasar: ${c.legal_basis})` : ""}`.trim(),
            evidence: null,
            origin: "GUARDRAIL",
        }));
    }
    catch {
        return [];
    }
}
async function analyzeDocument(buffer, mimeType, fileName, kind) {
    console.log(`[AI] document received kind=${kind} type=${mimeType} size=${buffer.length}`);
    console.log("[AI] OCR started");
    const raw = (0, ocrService_1.applyOcrCorrections)(await ocrWithPages(buffer, mimeType));
    const pages = [...raw.matchAll(PAGE_MARKER)].length || null;
    console.log(`[AI] OCR completed pages=${pages ?? "?"} chars=${raw.length}`);
    console.log("[AI] extraction started");
    const prompt = kind === "INVOICE" ? INVOICE_PROMPT : kind === "OTHER" ? OTHER_PROMPT : CONTRACT_PROMPT;
    const parsed = await askJson(prompt, raw);
    console.log("[AI] extraction completed");
    const warnings = strList(parsed.warnings, 10);
    const documentType = strOrNull(parsed.document_type, 40) ?? "OTHER";
    const base = {
        kind,
        documentType,
        confidence: typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1 ? parsed.confidence : null,
        summary: strOrNull(parsed.summary, 600) ?? "",
        contract: null,
        terms: null,
        milestones: [],
        invoice: null,
        approval: null,
        fieldEvidence: {},
        risks: [],
        warnings,
        extractionMeta: { sourceFile: fileName, pages, processedAt: new Date().toISOString(), engine: `Gemini ${env_1.env.GEMINI_MODEL}`, textLength: raw.length },
    };
    const risks = (Array.isArray(parsed.risks) ? parsed.risks : []).slice(0, 10).map((r) => ({
        title: strOrNull(r.title, 160) ?? "Klausul perlu diperhatikan",
        severity: severity(r.severity),
        detail: strOrNull(r.detail, 600) ?? "",
        evidence: locateQuote(raw, r.evidence_quote),
        origin: "AI",
    }));
    if (kind === "CONTRACT" || kind === "ADDENDUM") {
        base.fieldEvidence = evidenceFields(raw, parsed.field_evidence, {
            contract_number: "contractNumber",
            contract_value: "contractValue",
            start_date: "startDate",
            deadline: "deadline",
            revision_limit: "revisionLimit",
            scope: "scope",
            hourly_rate: "hourlyRate",
            revision_unit_price: "revisionUnitPrice",
            penalty: "penalty",
        }, warnings);
        base.milestones = (Array.isArray(parsed.milestones) ? parsed.milestones : []).slice(0, 20).map((m, i) => {
            let pct = typeof m.billing_percentage === "number" ? m.billing_percentage : null;
            if (pct !== null && !(pct > 0 && pct <= 100)) {
                warnings.push(`Persentase termin ${i + 1} dari AI tidak valid (${pct}); dikosongkan.`);
                pct = null;
            }
            return {
                name: strOrNull(m.name, 160) ?? `Termin ${i + 1}`,
                billingPercentage: pct,
                trigger: strOrNull(m.trigger, 300) ?? "",
                targetDate: asDate(m.target_date, `target termin ${i + 1}`, warnings),
                evidence: locateQuote(raw, m.evidence_quote),
            };
        });
        const pctSum = base.milestones.reduce((s, m) => s + (m.billingPercentage ?? 0), 0);
        if (kind === "CONTRACT" && base.milestones.length && Math.abs(pctSum - 100) > 0.01)
            warnings.push(`Total persentase termin dari dokumen ${pctSum}% (bukan 100%). Periksa sebelum menyetujui.`);
        base.contract = {
            contractNumber: strOrNull(parsed.contract_number, 120),
            title: strOrNull(parsed.title, 200),
            clientName: strOrNull(parsed.client_name, 160),
            vendorName: strOrNull(parsed.vendor_name, 160),
            contractValue: asInt(parsed.contract_value, "nilai kontrak", warnings, 1000000000000),
            startDate: asDate(parsed.start_date, "mulai", warnings),
            deadline: asDate(parsed.deadline, "tenggat", warnings),
            revisionLimit: asInt(parsed.revision_limit, "batas revisi", warnings, 1000),
            paymentTermsSummary: strOrNull(parsed.payment_terms_summary, 1000),
            scope: strList(parsed.scope),
            obligations: strList(parsed.obligations),
            penalties: strList(parsed.penalties),
        };
        const t = (parsed.terms ?? {});
        base.terms = {
            hourlyRate: asInt(t.hourly_rate, "tarif per jam", warnings, 1000000000),
            revisionUnitPrice: asInt(t.revision_unit_price, "biaya revisi tambahan", warnings, 1000000000),
            revisionExtensionDays: asInt(t.revision_extension_days, "tambahan hari revisi", warnings, 365),
            penaltyPerDayPercent: asNum(t.penalty_per_day_percent, "denda per hari", warnings, 100),
            penaltyCapPercent: asNum(t.penalty_cap_percent, "batas denda", warnings, 100),
            paymentDueDays: asInt(t.payment_due_days, "tempo pembayaran", warnings, 365),
        };
        base.risks = [...risks, ...(await guardrailRisks(raw))];
    }
    else if (kind === "INVOICE") {
        base.fieldEvidence = evidenceFields(raw, parsed.field_evidence, { invoice_number: "invoiceNumber", total: "total", milestone_reference: "milestoneReference" }, warnings);
        base.invoice = {
            invoiceNumber: strOrNull(parsed.invoice_number, 80),
            issueDate: asDate(parsed.issue_date, "tanggal invoice", warnings),
            issuer: strOrNull(parsed.issuer, 160),
            recipient: strOrNull(parsed.recipient, 160),
            total: asInt(parsed.total, "total invoice", warnings, 1000000000000),
            milestoneReference: strOrNull(parsed.milestone_reference, 200),
            revisionsCharged: asInt(parsed.revisions_charged, "revisi ditagih", warnings, 1000),
            lineItems: (Array.isArray(parsed.line_items) ? parsed.line_items : []).slice(0, 50).map((l, i) => ({
                description: strOrNull(l.description, 200) ?? `Baris ${i + 1}`,
                quantity: asNum(l.quantity, `kuantitas baris ${i + 1}`, warnings, 1000000),
                unit: strOrNull(l.unit, 40),
                unitPrice: asInt(l.unit_price, `harga satuan baris ${i + 1}`, warnings, 1000000000000),
                amount: asInt(l.amount, `jumlah baris ${i + 1}`, warnings, 1000000000000),
                evidence: locateQuote(raw, l.evidence_quote),
            })),
        };
        base.risks = risks;
    }
    else {
        const a = (parsed.approval ?? {});
        base.approval = {
            approved: typeof a.approved === "boolean" ? a.approved : null,
            approver: strOrNull(a.approver, 160),
            date: asDate(a.date, "tanggal persetujuan", warnings),
            reference: strOrNull(a.reference, 200),
        };
        base.risks = (Array.isArray(parsed.key_points) ? parsed.key_points : []).slice(0, 8).map((k) => ({
            title: "Poin penting",
            severity: "LOW",
            detail: strOrNull(k.text, 400) ?? "",
            evidence: locateQuote(raw, k.evidence_quote),
            origin: "AI",
        }));
    }
    const declared = kind === "OTHER" ? null : kind;
    if (declared && documentType !== declared && !(declared === "CONTRACT" && documentType === "ADDENDUM")) {
        warnings.unshift(`Dokumen diunggah sebagai ${declared}, tetapi terdeteksi sebagai ${documentType}. Periksa jenis dokumen.`);
    }
    console.log(`[AI] extraction normalized kind=${kind} type=${documentType} warnings=${warnings.length}`);
    return base;
}
/** Backwards-compatible entry used by the original contract flow. */
const extractContract = (buffer, mimeType, fileName) => analyzeDocument(buffer, mimeType, fileName, "CONTRACT");
exports.extractContract = extractContract;
//# sourceMappingURL=contractExtractionService.js.map