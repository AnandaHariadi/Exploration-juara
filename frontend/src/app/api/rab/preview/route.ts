export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { badRequest, ok, route } from '@/lib/api';
import { extensionOf, MAX_RAB_BYTES, RAB_TYPES } from '@/lib/files';
import { parseRabBuffer } from '@/lib/rab';

/** Validate a RAB before creating a project; this endpoint does not save data. */
export const POST = route('POST /api/rab/preview', async (req: NextRequest) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('Kirim berkas sebagai multipart/form-data.', 'INVALID_UPLOAD');
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) throw badRequest('Pilih berkas RAB.', 'FILE_REQUIRED');
  if (!RAB_TYPES[extensionOf(file.name)]) throw badRequest('RAB harus berkas CSV, XLSX, atau XLS.', 'UNSUPPORTED_TYPE');
  if (file.size > MAX_RAB_BYTES) throw badRequest('Ukuran RAB maksimal 5 MB.', 'FILE_TOO_LARGE');
  try {
    const parsed = parseRabBuffer(Buffer.from(await file.arrayBuffer()), file.name);
    return ok({ itemCount: parsed.items.length, total: parsed.total, warnings: parsed.warnings });
  } catch (error) {
    throw badRequest(`RAB tidak dapat dibaca: ${error instanceof Error ? error.message : 'format tidak dikenali'}`, 'INVALID_RAB');
  }
});
