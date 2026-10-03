export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { badRequest, ok, route } from '@/lib/api';
import { addDocument, randomId } from '@/lib/domain';
import { CONTRACT_TYPES, extensionOf, MAX_CONTRACT_BYTES, MAX_RAB_BYTES, RAB_TYPES, saveDocumentFile } from '@/lib/files';
import { parseRabCsv } from '@/lib/rab';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/documents', async (_req: NextRequest, ctx: ProjectParams) => ok(claraDb.requireProject(await projectIdFrom(ctx)).documents));

/** multipart/form-data: kind=CONTRACT|RAB, file=<file>. Type is decided by extension, not the client-supplied MIME. */
export const POST = route('POST /api/projects/[id]/documents', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  claraDb.requireProject(id);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('Kirim berkas sebagai multipart/form-data.', 'INVALID_UPLOAD');
  }
  const kind = form.get('kind');
  const file = form.get('file');
  if (kind !== 'CONTRACT' && kind !== 'RAB') throw badRequest('kind harus CONTRACT atau RAB.');
  if (!(file instanceof File) || file.size === 0) throw badRequest('Pilih berkas yang akan diunggah.', 'FILE_REQUIRED');
  const ext = extensionOf(file.name);
  const types = kind === 'CONTRACT' ? CONTRACT_TYPES : RAB_TYPES;
  const mimeType = types[ext];
  if (!mimeType) throw badRequest(kind === 'CONTRACT' ? 'Kontrak harus PDF, JPG, PNG, atau WebP.' : 'RAB harus berkas CSV (kolom: kategori, deskripsi, jumlah). XLSX belum didukung — simpan sebagai CSV.', 'UNSUPPORTED_TYPE');
  const max = kind === 'CONTRACT' ? MAX_CONTRACT_BYTES : MAX_RAB_BYTES;
  if (file.size > max) throw badRequest(`Ukuran berkas maksimal ${Math.round(max / 1024 / 1024)} MB.`, 'FILE_TOO_LARGE');
  const data = Buffer.from(await file.arrayBuffer());
  if (kind === 'CONTRACT' && ext === 'pdf' && data.subarray(0, 5).toString() !== '%PDF-') throw badRequest('Berkas bukan PDF yang valid.', 'UNSUPPORTED_TYPE');
  if (kind === 'RAB') {
    try {
      parseRabCsv(data.toString('utf8'));
    } catch (error) {
      throw badRequest(`RAB tidak dapat dibaca: ${error instanceof Error ? error.message : 'format tidak dikenali'}`, 'INVALID_RAB');
    }
  }
  const mctx = makeCtx();
  const docId = randomId('DOC');
  const { project, result } = claraDb.mutate(id, (p) => addDocument(p, mctx, { kind, fileName: file.name.slice(0, 200), mimeType, size: file.size, isSample: false }, docId));
  saveDocumentFile(id, result.id, data);
  return ok({ project, document: result }, 201);
});
