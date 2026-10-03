export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { assertId, ok, readJson, route, str } from '@/lib/api';
import { reviseDocument } from '@/lib/remediation';

/** Revise a draft with an AI instruction, or save a manual edit ({ content }). Re-validated; approval resets. */
export const POST = route('POST /api/ai/documents/revise', async (req: NextRequest) => {
  const body = await readJson(req);
  const projectId = assertId(str(body, 'projectId', { required: true }), 'ID proyek');
  const draftId = assertId(str(body, 'draftId', { required: true }), 'ID draf');
  return ok(await reviseDocument(projectId, draftId, { instruction: str(body, 'instruction', { max: 2000 }) || undefined, content: typeof body.content === 'string' ? body.content : undefined }));
});
