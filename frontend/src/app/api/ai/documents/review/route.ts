export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { assertId, ok, readJson, route, str } from '@/lib/api';
import { startDocumentAnalysis } from '@/lib/guardian';

/** (Re)run the Document Guardian on a stored document and wait for the result. */
export const POST = route('POST /api/ai/documents/review', async (req: NextRequest) => {
  const body = await readJson(req);
  const projectId = assertId(str(body, 'projectId', { required: true }), 'ID proyek');
  const documentId = assertId(str(body, 'documentId', { required: true }), 'ID dokumen');
  return ok(await startDocumentAnalysis(projectId, documentId));
});
