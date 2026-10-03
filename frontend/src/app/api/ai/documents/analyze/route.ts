export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { badRequest, ok, route } from '@/lib/api';
import { aiAnalyzeDocument } from '@/lib/ai';
import { CONTRACT_TYPES, extensionOf, MAX_CONTRACT_BYTES, MAX_RAB_BYTES, RAB_TYPES } from '@/lib/files';
import { parseRabBuffer } from '@/lib/rab';

/**
 * Stateless analysis (nothing stored): multipart contract (or document + kind)
 * and optional RAB CSV/Excel → normalized structured data, findings and evidence.
 * Project flows use document upload, which triggers the Document Guardian.
 */
export const POST = route('POST /api/ai/documents/analyze', async (req: NextRequest) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('Kirim berkas sebagai multipart/form-data.', 'INVALID_UPLOAD');
  }
  const file = form.get('contract') ?? form.get('file');
  const rawKind = String(form.get('kind') ?? 'CONTRACT').toUpperCase();
  const kind = (['CONTRACT', 'ADDENDUM', 'INVOICE', 'OTHER'] as const).find((k) => k === rawKind) ?? 'OTHER';
  if (!(file instanceof File) || file.size === 0) throw badRequest('Field contract (atau file) wajib berisi berkas.', 'FILE_REQUIRED');
  const mimeType = CONTRACT_TYPES[extensionOf(file.name)];
  if (!mimeType) throw badRequest('Dokumen harus PDF, JPG, PNG, atau WebP.', 'UNSUPPORTED_TYPE');
  if (file.size > MAX_CONTRACT_BYTES) throw badRequest('Ukuran dokumen maksimal 10 MB.', 'FILE_TOO_LARGE');
  let rab = null;
  const rabFile = form.get('rab');
  if (rabFile instanceof File && rabFile.size > 0) {
    if (!RAB_TYPES[extensionOf(rabFile.name)]) throw badRequest('RAB harus CSV, XLSX, atau XLS.', 'UNSUPPORTED_TYPE');
    if (rabFile.size > MAX_RAB_BYTES) throw badRequest('RAB maksimal 5 MB.', 'FILE_TOO_LARGE');
    try {
      rab = parseRabBuffer(Buffer.from(await rabFile.arrayBuffer()), rabFile.name);
    } catch (error) {
      throw badRequest(`RAB tidak dapat dibaca: ${error instanceof Error ? error.message : 'format tidak dikenali'}`, 'INVALID_RAB');
    }
  }
  const r = await aiAnalyzeDocument(Buffer.from(await file.arrayBuffer()), file.name, mimeType, 'adhoc', kind);
  return ok({
    documentType: r.documentType,
    confidence: r.confidence,
    summary: r.summary,
    structuredData: {
      ...r.contract,
      terms: r.terms,
      milestones: r.milestones.map((m) => ({ ...m, billingPercentage: m.percentage, evidence: m.source ?? null })),
      invoice: r.invoice,
      approval: r.approval,
      rab,
    },
    findings: r.risks.map((x) => ({ title: x.title, severity: x.severity, detail: x.detail, basis: 'AI_FINDING', origin: x.origin, evidence: x.source ?? null })),
    evidence: Object.entries(r.sources).map(([field, s]) => ({ field, page: s.page, snippet: s.snippet, verified: s.verified })),
    recommendations: r.risks.filter((x) => x.severity !== 'LOW').map((x) => `Tinjau klausul: ${x.title}`),
    remediationOptions: r.risks.filter((x) => x.severity !== 'LOW').map((x) => ({ type: 'CLAUSE_REVISION', title: x.title })),
    warnings: r.warnings,
    extractionMeta: r.extractionMeta,
  });
});
