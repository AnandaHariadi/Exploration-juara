export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { badRequest, ok, route } from '@/lib/api';
import { aiExtractContract } from '@/lib/ai';
import { CONTRACT_TYPES, extensionOf, MAX_CONTRACT_BYTES, MAX_RAB_BYTES } from '@/lib/files';
import { parseRabCsv } from '@/lib/rab';

/**
 * Stateless analysis: multipart contract (+ optional RAB CSV) → normalized
 * extraction. Nothing is stored; project flows use POST /api/projects/[id]/extract.
 */
export const POST = route('POST /api/ai/documents/analyze', async (req: NextRequest) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('Kirim berkas sebagai multipart/form-data.', 'INVALID_UPLOAD');
  }
  const contract = form.get('contract');
  if (!(contract instanceof File) || contract.size === 0) throw badRequest('Field contract wajib berisi berkas kontrak.', 'FILE_REQUIRED');
  const mimeType = CONTRACT_TYPES[extensionOf(contract.name)];
  if (!mimeType) throw badRequest('Kontrak harus PDF, JPG, PNG, atau WebP.', 'UNSUPPORTED_TYPE');
  if (contract.size > MAX_CONTRACT_BYTES) throw badRequest('Ukuran kontrak maksimal 10 MB.', 'FILE_TOO_LARGE');

  let rab = null;
  const rabFile = form.get('rab');
  if (rabFile instanceof File && rabFile.size > 0) {
    if (extensionOf(rabFile.name) !== 'csv' || rabFile.size > MAX_RAB_BYTES) throw badRequest('RAB harus CSV maksimal 2 MB.', 'UNSUPPORTED_TYPE');
    rab = parseRabCsv(Buffer.from(await rabFile.arrayBuffer()).toString('utf8'));
  }
  const result = await aiExtractContract(Buffer.from(await contract.arrayBuffer()), contract.name, mimeType, 'adhoc');
  return ok({
    documentType: result.documentType,
    confidence: result.confidence,
    contract: result.contract,
    milestones: result.milestones.map((m) => ({ ...m, billingPercentage: m.percentage, evidence: m.source ?? null })),
    risks: result.risks,
    evidence: Object.entries(result.sources).map(([field, s]) => ({ field, page: s.page, snippet: s.snippet, verified: s.verified })),
    rab,
    warnings: result.warnings,
    extractionMeta: result.extractionMeta,
  });
});
