export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { assertId, ok, readJson, route, str } from '@/lib/api';
import { draftChangeRequestFromAlert } from '@/lib/remediation';

/** "Generate Change Request" from an alert: deterministic proposal + AI-written addendum draft. Created as DRAFT for PIC review. */
export const POST = route('POST /api/ai/change-requests/draft', async (req: NextRequest) => {
  const body = await readJson(req);
  const projectId = assertId(str(body, 'projectId', { required: true }), 'ID proyek');
  return ok(await draftChangeRequestFromAlert(projectId, str(body, 'alertId', { required: true, max: 160 })), 201);
});
