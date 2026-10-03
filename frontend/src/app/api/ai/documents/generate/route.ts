export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { assertId, ok, oneOf, readJson, route, str } from '@/lib/api';
import { generateDocument } from '@/lib/remediation';

const TYPES = ['CHANGE_REQUEST', 'ADDENDUM', 'MOU', 'LOI', 'PKS', 'CLAUSE_REVISION', 'ANOMALY_RESPONSE'] as const;

/** Document Studio / Remediation Copilot: draft a document from project context + verified facts, then self-review it. */
export const POST = route('POST /api/ai/documents/generate', async (req: NextRequest) => {
  const body = await readJson(req);
  const projectId = assertId(str(body, 'projectId', { required: true, label: 'Proyek' }), 'ID proyek');
  const result = await generateDocument(projectId, {
    type: oneOf(body, 'type', TYPES),
    title: str(body, 'title', { max: 200 }) || undefined,
    instructions: str(body, 'instructions', { max: 2000 }) || undefined,
    alertId: str(body, 'alertId', { max: 160 }) || undefined,
    changeRequestId: str(body, 'changeRequestId', { max: 80 }) || undefined,
    originalClause: str(body, 'originalClause', { max: 4000 }) || undefined,
  });
  return ok(result, 201);
});
